import { USER_ROLES } from '@real-estate/shared';
import { DataTypes } from 'sequelize';

// One row per role an account holds; one email can be both buyer and developer (Q-031).
export function defineUserRole(sequelize) {
  const UserRole = sequelize.define(
    'UserRole',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      role: { type: DataTypes.ENUM(...USER_ROLES), allowNull: false },
    },
    { tableName: 'user_roles', underscored: true },
  );

  UserRole.associate = (models) => {
    UserRole.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return UserRole;
}
