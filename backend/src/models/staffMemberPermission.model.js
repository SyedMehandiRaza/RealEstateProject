import { STAFF_PERMISSIONS } from '@real-estate/shared';
import { DataTypes } from 'sequelize';

// One granted access area of a staff member; an area without a row is not granted (STAFF-DEC-002).
export function defineStaffMemberPermission(sequelize) {
  const StaffMemberPermission = sequelize.define(
    'StaffMemberPermission',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      staffMemberId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      permission: { type: DataTypes.ENUM(...STAFF_PERMISSIONS), allowNull: false },
    },
    { tableName: 'staff_member_permissions', underscored: true },
  );

  StaffMemberPermission.associate = (models) => {
    StaffMemberPermission.belongsTo(models.StaffMember, { foreignKey: 'staffMemberId', as: 'staffMember' });
  };

  return StaffMemberPermission;
}
