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

  const insertPermissions = (staffMemberId, permissions, { transaction }) =>
    StaffMemberPermission.bulkCreate(
      permissions.map((permission) => ({ staffMemberId, permission })),
      { transaction },
    );

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

    // Locks the member row for a write, so concurrent edits of one member run in turn.
    lockMember(employerId, id, { transaction }) {
      return StaffMember.findOne({ where: { id, employerId }, transaction, lock: transaction.LOCK.UPDATE });
    },

    update(member, { fullName, email, phone, role }, { transaction }) {
      return member.update({ fullName, email, phone, role }, { transaction });
    },

    // Replaces the member's permission set (STAFF-SPEC-001 E4).
    async replacePermissions(staffMemberId, permissions, { transaction }) {
      await StaffMemberPermission.destroy({ where: { staffMemberId }, transaction });
      await insertPermissions(staffMemberId, permissions, { transaction });
    },

    async memberExists(employerId, id, { transaction } = {}) {
      return (await StaffMember.count({ where: { id, employerId }, transaction })) > 0;
    },

    // The employer's properties not yet assigned to this member, for the Assign Property picker (E7): one
    // query, a LEFT JOIN on this member's assignment and IS NULL. Read-only on the property tables (STAFF-DEC-009).
    assignableProperties(employerId, staffMemberId) {
      return Property.findAll({
        where: { ownerId: employerId, '$staffAssignments.id$': null },
        include: [
          {
            model: StaffPropertyAssignment,
            as: 'staffAssignments',
            attributes: [],
            where: { staffMemberId },
            required: false,
          },
        ],
        attributes: ['id', 'name', 'city', 'state', 'propertyStatus'],
        order: [
          ['name', 'ASC'],
          ['id', 'ASC'],
        ],
      });
    },

    // One of the employer's own properties (STAFF-DEC-005), or null.
    findOwnProperty(employerId, propertyId, { transaction }) {
      return Property.findOne({
        where: { id: propertyId, ownerId: employerId },
        attributes: ['id'],
        transaction,
      });
    },

    // The unique pair (staff_member_id, property_id) refuses a second assignment, also between races.
    assignProperty(staffMemberId, propertyId, { transaction }) {
      return StaffPropertyAssignment.create({ staffMemberId, propertyId }, { transaction });
    },

    // Returns the number of assignments removed (0 or 1).
    unassignProperty(staffMemberId, propertyId, { transaction }) {
      return StaffPropertyAssignment.destroy({ where: { staffMemberId, propertyId }, transaction });
    },

    // Hard delete (STAFF-DEC-003): permissions and assignments go with it by FK CASCADE. Returns the count.
    remove(employerId, id) {
      return StaffMember.destroy({ where: { id, employerId } });
    },

    async create({ employerId, fullName, email, phone, role, permissions }, { transaction }) {
      const member = await StaffMember.create({ employerId, fullName, email, phone, role }, { transaction });
      await insertPermissions(member.id, permissions, { transaction });
      return member;
    },
  };
}
