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
