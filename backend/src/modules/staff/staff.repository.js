// Staff queries. Every query is scoped to the employer, so another developer's staff are never read.
export function createStaffRepository(models) {
  const { StaffMember } = models;

  return {
    // Staff List: newest first, ties broken by id (idx_staff_members_employer_id_created_at).
    listForEmployer(employerId, { page, pageSize }) {
      return StaffMember.findAndCountAll({
        where: { employerId },
        attributes: ['id', 'fullName', 'email', 'phone', 'role', 'status', 'createdAt'],
        order: [
          ['createdAt', 'DESC'],
          ['id', 'DESC'],
        ],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
    },
  };
}
