import { staffMessages } from '@real-estate/shared';
import { ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';
import { AppError } from '../../utils/AppError.js';
import { toPropertyCard, toStaffMember, toStaffMemberSummary } from './staff.presenter.js';

const emailConflict = (message) => new AppError('CONFLICT', { fields: { email: [message] } });
// Unknown and other developers' staff members look the same: 404, never 403 (STAFF-SPEC-001 §Access).
const staffNotFound = () => new AppError('NOT_FOUND', { message: staffMessages.api.notFound });

// Staff use cases (STAFF-SPEC-001). `employerId` is always the caller's account id.
export function createStaffService({ sequelize, repository }) {
  // A developer cannot add their own account email as staff (STAFF-DEC-017). Emails are stored lowercase.
  async function assertNotOwnEmail(employerId, email, { transaction }) {
    const ownEmail = await repository.findAccountEmail(employerId, { transaction });
    if (ownEmail?.toLowerCase() === email) throw emailConflict(staffMessages.email.self);
  }

  // Runs a write and turns the DB constraint errors it can hit into the API's answers: the unique indexes
  // decide duplicates (also between concurrent requests), and a foreign key failing means a row was deleted
  // meanwhile. `onUnique` / `onForeignKey` build the AppError; without one, the error goes on unchanged.
  async function mappingConstraintErrors(work, { onUnique, onForeignKey } = {}) {
    try {
      return await work();
    } catch (error) {
      if (onUnique && error instanceof UniqueConstraintError) throw onUnique();
      if (onForeignKey && error instanceof ForeignKeyConstraintError) throw onForeignKey();
      throw error;
    }
  }

  // The unique index (employer_id, email) decides duplicate emails (STAFF-DEC-004).
  const duplicateEmail = { onUnique: () => emailConflict(staffMessages.email.taken) };

  async function findOwnMember(employerId, id, { transaction } = {}) {
    const member = await repository.findDetail(employerId, id, { transaction });
    if (!member) throw staffNotFound();
    return member;
  }

  return {
    async list(employerId, { page, pageSize }) {
      const { rows, count } = await repository.listForEmployer(employerId, { page, pageSize });
      return { staffMembers: rows.map(toStaffMemberSummary), total: count };
    },

    // Add Staff (E2): the member and its permissions in one transaction; status starts active.
    async create(employerId, input) {
      const member = await mappingConstraintErrors(
        () =>
          sequelize.transaction(async (transaction) => {
            await assertNotOwnEmail(employerId, input.email, { transaction });
            const created = await repository.create({ employerId, ...input }, { transaction });
            return repository.findDetail(employerId, created.id, { transaction });
          }),
        duplicateEmail,
      );
      return { staffMember: toStaffMember(member) };
    },

    // Staff Detail (E3).
    async get(employerId, id) {
      return { staffMember: toStaffMember(await findOwnMember(employerId, id)) };
    },

    // Edit Staff (E4): fields and the permission set in one transaction; status and assignments stay.
    // The member is found (or 404) before the email rules, so another developer's data never shows.
    async update(employerId, id, { permissions, ...fields }) {
      const member = await mappingConstraintErrors(
        () =>
          sequelize.transaction(async (transaction) => {
            const locked = await repository.lockMember(employerId, id, { transaction });
            if (!locked) throw staffNotFound();
            await assertNotOwnEmail(employerId, fields.email, { transaction });
            await repository.update(locked, fields, { transaction });
            await repository.replacePermissions(id, permissions, { transaction });
            return repository.findDetail(employerId, id, { transaction });
          }),
        duplicateEmail,
      );
      return { staffMember: toStaffMember(member) };
    },

    // Status dropdown (E5): saved at once; the same status again is a no-op 200 (STAFF-DEC-014).
    async changeStatus(employerId, id, { status }) {
      const member = await sequelize.transaction(async (transaction) => {
        const locked = await repository.lockMember(employerId, id, { transaction });
        if (!locked) throw staffNotFound();
        if (locked.status !== status) await locked.update({ status }, { transaction });
        return repository.findDetail(employerId, id, { transaction });
      });
      return { staffMember: toStaffMember(member) };
    },

    // Remove (E6). Already removed, unknown or another developer's: 404.
    async remove(employerId, id) {
      if ((await repository.remove(employerId, id)) === 0) throw staffNotFound();
    },

    // Assign Property picker (E7).
    async assignableProperties(employerId, id) {
      if (!(await repository.memberExists(employerId, id))) throw staffNotFound();
      const properties = await repository.assignableProperties(employerId, id);
      return { properties: properties.map((property) => toPropertyCard(property)) };
    },

    // Assign Property (E8): ownership check and insert in one transaction; disabled members too.
    async assignProperty(employerId, id, { propertyId }) {
      const propertyNotFound = () =>
        new AppError('NOT_FOUND', { message: staffMessages.api.propertyNotFound });
      const member = await mappingConstraintErrors(
        () =>
          sequelize.transaction(async (transaction) => {
            if (!(await repository.lockMember(employerId, id, { transaction }))) throw staffNotFound();
            if (!(await repository.findOwnProperty(employerId, propertyId, { transaction }))) {
              throw propertyNotFound();
            }
            await repository.assignProperty(id, propertyId, { transaction });
            return repository.findDetail(employerId, id, { transaction });
          }),
        {
          onUnique: () => new AppError('CONFLICT', { message: staffMessages.api.alreadyAssigned }),
          // The property was deleted between the ownership check and the insert.
          onForeignKey: propertyNotFound,
        },
      );
      return { staffMember: toStaffMember(member) };
    },

    // Unassign (E9): the property itself is untouched.
    async unassignProperty(employerId, id, propertyId) {
      const member = await sequelize.transaction(async (transaction) => {
        if (!(await repository.lockMember(employerId, id, { transaction }))) throw staffNotFound();
        if ((await repository.unassignProperty(id, propertyId, { transaction })) === 0) {
          throw new AppError('NOT_FOUND', { message: staffMessages.api.notAssigned });
        }
        return repository.findDetail(employerId, id, { transaction });
      });
      return { staffMember: toStaffMember(member) };
    },
  };
}
