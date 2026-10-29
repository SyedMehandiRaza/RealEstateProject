import { createUserDeletionService } from '../userDeletion.service.js';

// Fake sequelize.transaction(callback): runs the callback with a transaction object and records
// whether it committed or rolled back, like a managed Sequelize transaction.
function fakeSequelize(events) {
  return {
    async transaction(callback) {
      const transaction = { id: 'tx-1' };
      events.push('begin');
      try {
        const result = await callback(transaction);
        events.push('commit');
        return result;
      } catch (error) {
        events.push('rollback');
        throw error;
      }
    },
  };
}

function setup({ user = { id: 7 }, documents = [] } = {}) {
  const events = [];
  const userRow = user && {
    ...user,
    destroy: jest.fn(async ({ transaction }) => events.push(`destroy user in ${transaction.id}`)),
  };
  const models = {
    User: { findByPk: jest.fn(async () => userRow) },
    ProfessionalProfile: {},
    VerificationDocument: { findAll: jest.fn(async () => documents) },
  };
  const fileDeletion = {
    enqueue: jest.fn(async (files, { transaction }) =>
      events.push(`enqueue ${files.length} in ${transaction.id}`),
    ),
  };
  const storage = { destroy: jest.fn() };
  const service = createUserDeletionService({ sequelize: fakeSequelize(events), models, fileDeletion });
  return { service, events, models, fileDeletion, storage, userRow };
}

const documents = [
  { cloudinaryPublicId: 'realestate/test/documents/3/id.pdf', cloudinaryResourceType: 'raw' },
  { cloudinaryPublicId: 'realestate/test/documents/3/photo', cloudinaryResourceType: 'image' },
];

describe('deleteUser', () => {
  it("enqueues each of the user's files in the same transaction, before deleting the user", async () => {
    const { service, events, fileDeletion } = setup({ documents });

    await service.deleteUser(7);

    expect(events).toEqual(['begin', 'enqueue 2 in tx-1', 'destroy user in tx-1', 'commit']);
    expect(fileDeletion.enqueue).toHaveBeenCalledWith(
      [
        {
          publicId: 'realestate/test/documents/3/id.pdf',
          resourceType: 'raw',
          deliveryType: 'authenticated',
        },
        {
          publicId: 'realestate/test/documents/3/photo',
          resourceType: 'image',
          deliveryType: 'authenticated',
        },
      ],
      { reason: 'record_deleted', transaction: { id: 'tx-1' } },
    );
  });

  it("finds the user's documents through their professional profile, inside the transaction", async () => {
    const { service, models } = setup({ documents });

    await service.deleteUser(7);

    const [options] = models.VerificationDocument.findAll.mock.calls[0];
    expect(options.transaction).toEqual({ id: 'tx-1' });
    expect(options.include[0]).toMatchObject({
      as: 'professionalProfile',
      where: { userId: 7 },
      required: true,
    });
  });

  it('never calls Cloudinary (the worker deletes after commit)', async () => {
    const { service, storage } = setup({ documents });

    await service.deleteUser(7);

    expect(storage.destroy).not.toHaveBeenCalled();
  });

  it('works for a buyer with no files', async () => {
    const { service, events } = setup({ documents: [] });

    await service.deleteUser(7);

    expect(events).toEqual(['begin', 'enqueue 0 in tx-1', 'destroy user in tx-1', 'commit']);
  });

  it('rolls back and keeps the user when enqueueing fails', async () => {
    const { service, events, fileDeletion, userRow } = setup({ documents });
    fileDeletion.enqueue.mockRejectedValueOnce(new Error('db error'));

    await expect(service.deleteUser(7)).rejects.toThrow('db error');

    expect(userRow.destroy).not.toHaveBeenCalled();
    expect(events).toEqual(['begin', 'rollback']);
  });

  it('throws NOT_FOUND for an unknown user', async () => {
    const { service, fileDeletion } = setup({ user: null });

    await expect(service.deleteUser(99)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(fileDeletion.enqueue).not.toHaveBeenCalled();
  });
});
