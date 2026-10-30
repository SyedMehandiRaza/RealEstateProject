import { DataTypes } from 'sequelize';

// Join table StaffMember <-> Property (the only staff -> property FK). The property must belong to the staff
// member's employer: checked in the service (STAFF-DEC-005).
export function defineStaffPropertyAssignment(sequelize) {
  const StaffPropertyAssignment = sequelize.define(
    'StaffPropertyAssignment',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      staffMemberId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      propertyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    { tableName: 'staff_property_assignments', underscored: true },
  );

  StaffPropertyAssignment.associate = (models) => {
    StaffPropertyAssignment.belongsTo(models.StaffMember, { foreignKey: 'staffMemberId', as: 'staffMember' });
    StaffPropertyAssignment.belongsTo(models.Property, { foreignKey: 'propertyId', as: 'property' });
  };

  return StaffPropertyAssignment;
}
