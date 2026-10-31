// Staff queries. Every query is scoped to the employer, so another developer's staff are never read.
export function createStaffRepository(models) {
  const { Property, StaffMember, StaffMemberPermission, StaffPropertyAssignment, User } = models;

  // A staff member with its permission areas and its assigned properties (newest assignment first).
  const detailIncludes = [
    { model: StaffMemberPermission, as: 'permissions', attributes: ['permission'], separate: true },
    {
      model: StaffPropertyAssignment,
      as: 'propertyAssignments',
      attributes: ['id', 'propertyId', 'createdAt'],
      separate: true,
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      include: [
        { model: Property, as: 'property', attributes: ['id', 'name', 'city', 'state', 'propertyStatus'] },
      ],
    },
  ];

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

    findDetail(employerId, id, { transaction } = {}) {
      return StaffMember.findOne({ where: { id, employerId }, include: detailIncludes, transaction });
    },

    async findAccountEmail(userId, { transaction } = {}) {
      const user = await User.findByPk(userId, { attributes: ['email'], transaction });
      return user?.email ?? null;
    },

    async create({ employerId, fullName, email, phone, role, permissions }, { transaction }) {
      const member = await StaffMember.create({ employerId, fullName, email, phone, role }, { transaction });
      await StaffMemberPermission.bulkCreate(
        permissions.map((permission) => ({ staffMemberId: member.id, permission })),
        { transaction },
      );
      return member;
    },
  };
}
