// Behaviour every pending_file_deletions repository must have: the Sequelize one
// (modules/files/pendingFileDeletion.repository.js) and the in-memory fake (test/fileFakes.js).
// Run from a unit test for the fake and an integration test for the real one, so the fake cannot drift.
// `makeRepository` is called before each test and returns an empty repository.

// Whole seconds: DATETIME columns have no fractional part.
const minutesFromNow = (minutes) => new Date(Math.ceil(Date.now() / 1000) * 1000 + minutes * 60_000);

const file = (publicId, overrides = {}) => ({
  publicId: `realestate/test/documents/1/${publicId}`,
  resourceType: 'image',
  deliveryType: 'authenticated',
  reason: 'record_deleted',
  ...overrides,
});

export function describeQueueRepositoryContract(name, makeRepository) {
  describe(`${name} (queue repository contract)`, () => {
    let repository;
    beforeEach(async () => {
      repository = await makeRepository();
    });

    it('queues a file as pending, due immediately, with no attempts yet', async () => {
      await repository.insertMany([file('a')]);

      const due = await repository.findDue(minutesFromNow(1), 10);
      expect(due).toHaveLength(1);
      expect(due[0]).toMatchObject({ ...file('a'), status: 'pending', attempts: 0, lastError: null });
    });

    it('queues the same file once, keeping the first row (ON DUPLICATE KEY)', async () => {
      await repository.insertMany([file('a')]);
      await repository.insertMany([file('a', { reason: 'orphan' }), file('b')]);

      const due = await repository.findDue(minutesFromNow(1), 10);
      expect(due.map((row) => [row.publicId, row.reason])).toEqual([
        [file('a').publicId, 'record_deleted'],
        [file('b').publicId, 'record_deleted'],
      ]);
    });

    it('treats the same public id with another resource type as another file', async () => {
      await repository.insertMany([file('a'), file('a', { resourceType: 'raw' })]);
      expect(await repository.findDue(minutesFromNow(1), 10)).toHaveLength(2);
    });

    it('returns a retried row only once its next attempt is due, oldest first, up to the limit', async () => {
      await repository.insertMany([file('a'), file('b'), file('c')]);
      const [a, b, c] = await repository.findDue(minutesFromNow(1), 10);
      await repository.scheduleRetry(a.id, {
        attempts: 1,
        lastError: 'boom',
        nextAttemptAt: minutesFromNow(5),
      });
      await repository.scheduleRetry(b.id, {
        attempts: 2,
        lastError: 'bang',
        nextAttemptAt: minutesFromNow(3),
      });

      expect((await repository.findDue(minutesFromNow(1), 10)).map((row) => row.id)).toEqual([c.id]);

      const later = await repository.findDue(minutesFromNow(10), 10);
      expect(later.map((row) => row.id)).toEqual([c.id, b.id, a.id]);
      expect(later[1]).toMatchObject({ attempts: 2, lastError: 'bang' });

      expect(await repository.findDue(minutesFromNow(10), 2)).toHaveLength(2);
    });

    it('never returns a row marked failed', async () => {
      await repository.insertMany([file('a')]);
      const [a] = await repository.findDue(minutesFromNow(1), 10);
      await repository.markFailed(a.id, { attempts: 5, lastError: 'gone for good' });
      expect(await repository.findDue(minutesFromNow(60), 10)).toEqual([]);
    });

    it('forgets a removed row', async () => {
      await repository.insertMany([file('a'), file('b')]);
      const [a, b] = await repository.findDue(minutesFromNow(1), 10);
      await repository.remove(a.id);
      expect((await repository.findDue(minutesFromNow(1), 10)).map((row) => row.id)).toEqual([b.id]);
    });
  });
}
