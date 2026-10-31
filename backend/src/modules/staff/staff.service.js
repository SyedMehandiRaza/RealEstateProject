import { staffMessages } from '@real-estate/shared';
import { UniqueConstraintError } from 'sequelize';
import { AppError } from '../../utils/AppError.js';
import { toStaffMember, toStaffMemberSummary } from './staff.presenter.js';

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

  // The unique index (employer_id, email) decides duplicates, also between concurrent requests (STAFF-DEC-004).
  async function mappingDuplicateEmail(work) {
    try {
      return await work();
    } catch (error) {
      if (error instanceof UniqueConstraintError) throw emailConflict(staffMessages.email.taken);
      throw error;
    }
  }

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
      const member = await mappingDuplicateEmail(() =>
        sequelize.transaction(async (transaction) => {
          await assertNotOwnEmail(employerId, input.email, { transaction });
          const created = await repository.create({ employerId, ...input }, { transaction });
          return repository.findDetail(employerId, created.id, { transaction });
        }),
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
      const member = await mappingDuplicateEmail(() =>
        sequelize.transaction(async (transaction) => {
          const locked = await repository.lockMember(employerId, id, { transaction });
          if (!locked) throw staffNotFound();
          await assertNotOwnEmail(employerId, fields.email, { transaction });
          await repository.update(locked, fields, { transaction });
          await repository.replacePermissions(id, permissions, { transaction });
          return repository.findDetail(employerId, id, { transaction });
        }),
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
  };
}
