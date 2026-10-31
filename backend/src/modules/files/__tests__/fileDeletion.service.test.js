import { createFileDeletionService } from '../fileDeletion.service.js';
import { createFakeQueueRepository, createFakeStorage, silentLogger } from '../../../test/fileFakes.js';

const MINUTE = 60_000;
const start = new Date('2026-10-29T10:00:00Z');

function setup() {
  let current = start;
  const storage = createFakeStorage();
  const repository = createFakeQueueRepository();
  const logger = silentLogger();
  const service = createFileDeletionService({
    repository,
    storage,
    logger,
    now: () => current,
    maxAttempts: 5,
    baseDelayMs: MINUTE,
  });
  const advance = (ms) => {
    current = new Date(current.getTime() + ms);
  };
  return { storage, repository, logger, service, advance };
}

const doc = {
  publicId: 'realestate/test/documents/1/a',
  resourceType: 'image',
  deliveryType: 'authenticated',
};

describe('file deletion worker (processDue)', () => {
  it('deletes a queued file, removes its row and logs the deletion', async () => {
    const { storage, repository, logger, service } = setup();
    await service.enqueue([doc], { reason: 'record_deleted' });

    const summary = await service.processDue();

    expect(summary).toEqual({ deleted: 1, retried: 0, failed: 0 });
    expect(storage.calls).toEqual([['destroy', doc.publicId]]);
    expect(repository.rows).toHaveLength(0);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ publicId: doc.publicId, reason: 'record_deleted' }),
      'Cloudinary file deleted',
    );
  });

  it('deletes a queued video with its video resource type (PROP-DEC-013)', async () => {
    const { storage, repository, service } = setup();
    const destroy = jest.spyOn(storage, 'destroy');
    const video = { ...doc, publicId: 'realestate/test/properties/1/walkthrough', resourceType: 'video' };
    await service.enqueue([video], { reason: 'record_deleted' });

    expect(await service.processDue()).toEqual({ deleted: 1, retried: 0, failed: 0 });
    expect(destroy).toHaveBeenCalledWith(
      expect.objectContaining({ publicId: video.publicId, resourceType: 'video' }),
    );
    expect(repository.rows).toEqual([]);
  });

  it('retries with exponential backoff and records the last error', async () => {
    const { storage, repository, service, advance } = setup();
    await service.enqueue([doc], { reason: 'record_deleted' });
    storage.failNextDestroys(2);

    expect(await service.processDue()).toEqual({ deleted: 0, retried: 1, failed: 0 });
    expect(repository.rows[0]).toMatchObject({
      attempts: 1,
      lastError: 'Cloudinary unavailable',
      nextAttemptAt: new Date(start.getTime() + MINUTE),
    });

    // Not due yet: nothing is attempted.
    expect(await service.processDue()).toEqual({ deleted: 0, retried: 0, failed: 0 });

    advance(MINUTE);
    await service.processDue();
    expect(repository.rows[0]).toMatchObject({
      attempts: 2,
      nextAttemptAt: new Date(start.getTime() + MINUTE + 2 * MINUTE),
    });

    advance(2 * MINUTE);
    expect(await service.processDue()).toEqual({ deleted: 1, retried: 0, failed: 0 });
    expect(repository.rows).toHaveLength(0);
    expect(storage.calls).toHaveLength(3);
  });

  it('flags the row for review after 5 failed attempts and stops retrying', async () => {
    const { storage, repository, logger, service, advance } = setup();
    await service.enqueue([doc], { reason: 'orphan' });
    storage.failNextDestroys(10);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await service.processDue();
      advance(60 * MINUTE);
    }

    expect(repository.rows[0]).toMatchObject({
      status: 'failed',
      attempts: 5,
      lastError: 'Cloudinary unavailable',
    });
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ publicId: doc.publicId, attempts: 5 }),
      expect.stringContaining('flagged for review'),
    );

    advance(24 * 60 * MINUTE);
    await service.processDue();
    expect(storage.calls).toHaveLength(5);
  });

  it('keeps going when one file fails', async () => {
    const { storage, repository, service } = setup();
    const other = { ...doc, publicId: 'realestate/test/documents/1/b' };
    await service.enqueue([doc, other], { reason: 'record_deleted' });
    storage.failNextDestroys(1);

    expect(await service.processDue()).toEqual({ deleted: 1, retried: 1, failed: 0 });
    expect(repository.rows.map((row) => row.publicId)).toEqual([doc.publicId]);
  });

  it('enqueue passes the caller transaction through and skips empty lists', async () => {
    const { repository, service } = setup();
    const transaction = { id: 'tx-1' };

    await service.enqueue([], { reason: 'record_deleted', transaction });
    expect(repository.rows).toHaveLength(0);

    await service.enqueue([doc], { reason: 'record_deleted', transaction });
    expect(repository.rows[0]).toMatchObject({ reason: 'record_deleted', transaction });
  });
});
