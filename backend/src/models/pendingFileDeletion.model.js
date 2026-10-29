import { DataTypes } from 'sequelize';

// Matches migration 20261029120000-create-pending-file-deletions.cjs (DEC-018).
export function definePendingFileDeletion(sequelize) {
  return sequelize.define(
    'PendingFileDeletion',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      publicId: { type: DataTypes.STRING(255), allowNull: false },
      resourceType: { type: DataTypes.ENUM('image', 'raw'), allowNull: false },
      deliveryType: {
        type: DataTypes.ENUM('upload', 'authenticated'),
        allowNull: false,
        defaultValue: 'authenticated',
      },
      reason: { type: DataTypes.ENUM('save_failed', 'record_deleted', 'orphan'), allowNull: false },
      status: { type: DataTypes.ENUM('pending', 'failed'), allowNull: false, defaultValue: 'pending' },
      attempts: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      lastError: { type: DataTypes.STRING(500), allowNull: true },
      nextAttemptAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'pending_file_deletions', underscored: true },
  );
}
