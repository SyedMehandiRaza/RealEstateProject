import models, { sequelize } from '../../../models/index.js';
import { describeQueueRepositoryContract } from '../../../test/queueRepositoryContract.js';
import { createPendingFileDeletionRepository } from '../pendingFileDeletion.repository.js';

const repository = createPendingFileDeletionRepository(models);
const file = {
  publicId: 'realestate/test/documents/1/a',
  resourceType: 'raw',
  deliveryType: 'authenticated',
  reason: 'save_failed',
};

describeQueueRepositoryContract('Sequelize repository on MySQL', () => repository);

describe('Sequelize repository on MySQL (database-only behaviour)', () => {
  it('queues inside the caller transaction: a rollback leaves no row', async () => {
    await expect(
      sequelize.transaction(async (transaction) => {
        await repository.insertMany([file], { transaction });
        throw new Error('the record deletion failed');
      }),
    ).rejects.toThrow('the record deletion failed');

    expect(await models.PendingFileDeletion.count()).toBe(0);
  });

  it('keeps a failed row with its attempts and last error for manual review', async () => {
    await repository.insertMany([{ ...file, lastError: 'first failure' }]);
    const [row] = await models.PendingFileDeletion.findAll({ raw: true });
    expect(row.lastError).toBe('first failure');

    await repository.markFailed(row.id, { attempts: 5, lastError: 'gone for good' });

    expect(await models.PendingFileDeletion.findByPk(row.id, { raw: true })).toMatchObject({
      status: 'failed',
      attempts: 5,
      lastError: 'gone for good',
    });
  });
});

// Property files (PROP-002, PROP-DEC-013): videos and replaced document files are queued like the others.
describe('Sequelize repository on MySQL: property files', () => {
  it('queues a video, and a file replaced by a new upload', async () => {
    await repository.insertMany([
      {
        ...file,
        publicId: 'realestate/test/properties/1/tour',
        resourceType: 'video',
        reason: 'record_deleted',
      },
      { ...file, publicId: 'realestate/test/properties/1/old.pdf', reason: 'replaced' },
    ]);

    const rows = await models.PendingFileDeletion.findAll({ raw: true, order: [['id', 'ASC']] });
    expect(rows).toEqual([
      expect.objectContaining({ resourceType: 'video', reason: 'record_deleted' }),
      expect.objectContaining({ resourceType: 'raw', reason: 'replaced' }),
    ]);
  });

  it('the table refuses a resource type or reason it does not know', async () => {
    const insert = (resourceType, reason) =>
      sequelize.query(
        `INSERT INTO pending_file_deletions (public_id, resource_type, reason) VALUES ('realestate/test/x', :resourceType, :reason)`,
        { replacements: { resourceType, reason } },
      );

    await expect(insert('audio', 'orphan')).rejects.toThrow();
    await expect(insert('video', 'moved')).rejects.toThrow();
    expect(await models.PendingFileDeletion.count()).toBe(0);
  });
});
