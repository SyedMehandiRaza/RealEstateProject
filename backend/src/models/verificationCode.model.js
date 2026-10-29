import { DataTypes } from 'sequelize';

// One Verification code (DEC-015): only its HMAC-SHA256 is stored. Matches migration
// 20261028183255-create-auth-tables.cjs. Written and read only by modules/auth/verificationCode.service.js.
export function defineVerificationCode(sequelize) {
  const VerificationCode = sequelize.define(
    'VerificationCode',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      purpose: { type: DataTypes.ENUM('email_verification', 'password_reset'), allowNull: false },
      codeHash: { type: DataTypes.CHAR(64), allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      attempts: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      usedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'verification_codes', underscored: true },
  );

  VerificationCode.associate = (models) => {
    VerificationCode.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return VerificationCode;
}
