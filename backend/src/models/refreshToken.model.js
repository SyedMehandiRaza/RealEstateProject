import { DataTypes } from 'sequelize';

// One login session. Only the SHA-256 of the refresh token is stored (`hashToken`), never the token.
// Matches migration 20261028183255-create-auth-tables.cjs.
export function defineRefreshToken(sequelize) {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      jti: { type: DataTypes.CHAR(36), allowNull: false },
      tokenHash: { type: DataTypes.CHAR(64), allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      revokedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'refresh_tokens', underscored: true },
  );

  RefreshToken.associate = (models) => {
    RefreshToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return RefreshToken;
}
