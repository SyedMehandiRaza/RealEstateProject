import { DataTypes } from 'sequelize';

// Matches migration 20261028183255-create-auth-tables.cjs.
export function defineUser(sequelize) {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      fullName: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(254), allowNull: false },
      phone: { type: DataTypes.STRING(16), allowNull: false },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      emailVerifiedAt: { type: DataTypes.DATE, allowNull: true },
      preferredCountryCode: { type: DataTypes.CHAR(2), allowNull: true },
    },
    {
      tableName: 'users',
      underscored: true,
      // Never serialize the password hash by accident. Only login and password reset use
      // User.scope('withPassword').
      defaultScope: { attributes: { exclude: ['passwordHash'] } },
      scopes: { withPassword: { attributes: { include: ['passwordHash'] } } },
    },
  );

  User.associate = (models) => {
    User.hasMany(models.UserRole, { foreignKey: 'userId', as: 'roles' });
    User.hasOne(models.ProfessionalProfile, { foreignKey: 'userId', as: 'professionalProfile' });
  };

  return User;
}
