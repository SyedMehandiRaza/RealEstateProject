import { LIMITS, STAFF_ROLES, STAFF_STATUSES } from '@real-estate/shared';
import { DataTypes } from 'sequelize';

const S = LIMITS.staff;

// Matches migration 20261030212742-create-staff-tables.cjs. A team member a Developer adds (employer,
// STAFF-DEC-006); `userId` is their own login account once linked (STAFF-DEC-001), NULL until then.
export function defineStaffMember(sequelize) {
  const StaffMember = sequelize.define(
    'StaffMember',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      employerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      fullName: { type: DataTypes.STRING(S.fullName.max), allowNull: false },
      email: { type: DataTypes.STRING(S.email.max), allowNull: false },
      phone: { type: DataTypes.STRING(S.phone.max), allowNull: false },
      role: { type: DataTypes.ENUM(...STAFF_ROLES), allowNull: false },
      status: { type: DataTypes.ENUM(...STAFF_STATUSES), allowNull: false, defaultValue: 'active' },
    },
    { tableName: 'staff_members', underscored: true },
  );

  StaffMember.associate = (models) => {
    StaffMember.belongsTo(models.User, { foreignKey: 'employerId', as: 'employer' });
    StaffMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    StaffMember.hasMany(models.StaffMemberPermission, { foreignKey: 'staffMemberId', as: 'permissions' });
    StaffMember.hasMany(models.StaffPropertyAssignment, {
      foreignKey: 'staffMemberId',
      as: 'propertyAssignments',
    });
    StaffMember.belongsToMany(models.Property, {
      through: models.StaffPropertyAssignment,
      foreignKey: 'staffMemberId',
      otherKey: 'propertyId',
      as: 'assignedProperties',
    });
  };

  return StaffMember;
}
