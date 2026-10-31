import { staffMessages } from '@real-estate/shared';
import { UniqueConstraintError } from 'sequelize';
import { AppError } from '../../utils/AppError.js';
import { toStaffMember, toStaffMemberSummary } from './staff.presenter.js';

const emailConflict = (message) => new AppError('CONFLICT', { fields: { email: [message] } });

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
  };
}
