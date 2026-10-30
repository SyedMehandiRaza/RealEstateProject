import { authMessages } from '@real-estate/shared';
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

function setup({ user = { id: 7 }, documents = [], ownedProperties = 0, employedStaff = 0 } = {}) {
  const events = [];
  const userRow = user && {
    ...user,
    destroy: jest.fn(async ({ transaction }) => events.push(`destroy user in ${transaction.id}`)),
  };
  const models = {
    User: { findByPk: jest.fn(async () => userRow) },
    ProfessionalProfile: {},
    VerificationDocument: { findAll: jest.fn(async () => documents) },
    Property: { count: jest.fn(async () => ownedProperties) },
    StaffMember: { count: jest.fn(async () => employedStaff) },
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

// An account that owns properties or employs staff is kept (PROP-DEC-001): those FKs are RESTRICT.
describe('deleteUser with properties or staff', () => {
  const conflict = { code: 'CONFLICT', status: 409, message: authMessages.api.accountHasPropertiesOrStaff };

  it.each([
    ['owns properties', { ownedProperties: 2 }],
    ['employs staff members', { employedStaff: 1 }],
    ['owns properties and employs staff', { ownedProperties: 1, employedStaff: 3 }],
  ])('throws CONFLICT with the shared message when the user %s', async (_case, counts) => {
    const { service, events, fileDeletion, userRow } = setup({ documents, ...counts });

    await expect(service.deleteUser(7)).rejects.toMatchObject(conflict);

    expect(fileDeletion.enqueue).not.toHaveBeenCalled();
    expect(userRow.destroy).not.toHaveBeenCalled();
    expect(events).toEqual(['begin', 'rollback']);
  });

  it("counts the user's properties and staff inside the transaction", async () => {
    const { service, models } = setup();

    await service.deleteUser(7);

    expect(models.Property.count).toHaveBeenCalledWith({
      where: { ownerId: 7 },
      transaction: { id: 'tx-1' },
    });
    expect(models.StaffMember.count).toHaveBeenCalledWith({
      where: { employerId: 7 },
      transaction: { id: 'tx-1' },
    });
  });

  it('locks the user row before counting, so no property or staff can be added meanwhile', async () => {
    const { service, models } = setup();

    await service.deleteUser(7);

    expect(models.User.findByPk).toHaveBeenCalledWith(7, { transaction: { id: 'tx-1' }, lock: true });
    expect(models.User.findByPk.mock.invocationCallOrder[0]).toBeLessThan(
      models.Property.count.mock.invocationCallOrder[0],
    );
  });
});
