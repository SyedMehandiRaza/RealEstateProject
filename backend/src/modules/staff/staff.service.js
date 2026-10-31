import { toStaffMemberSummary } from './staff.presenter.js';

// Staff use cases (STAFF-SPEC-001). `employerId` is always the caller's account id.
export function createStaffService({ repository }) {
  return {
    async list(employerId, { page, pageSize }) {
      const { rows, count } = await repository.listForEmployer(employerId, { page, pageSize });
      return { staffMembers: rows.map(toStaffMemberSummary), total: count };
    },
  };
}
