'use strict';

// Outbox of Cloudinary files to delete (DEC-018). Rows are inserted in the same transaction that deletes
// the owning records; a worker deletes the files after commit with retry and backoff, so Cloudinary is
// never called inside a DB transaction. A row is removed once its file is deleted; after the maximum
// number of attempts it stays with status 'failed' for manual review.

const TABLE_OPTIONS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' };

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'pending_file_deletions',
      {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        // Cloudinary public ids are case-sensitive: compare byte for byte.
        public_id: { type: 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin', allowNull: false },
        // Cloudinary needs both to delete an asset: destroy(public_id, { resource_type, type }).
        resource_type: { type: Sequelize.ENUM('image', 'raw'), allowNull: false },
        delivery_type: {
          type: Sequelize.ENUM('upload', 'authenticated'),
          allowNull: false,
          defaultValue: 'authenticated',
        },
        reason: { type: Sequelize.ENUM('save_failed', 'record_deleted', 'orphan'), allowNull: false },
        status: { type: Sequelize.ENUM('pending', 'failed'), allowNull: false, defaultValue: 'pending' },
        attempts: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        last_error: { type: Sequelize.STRING(500), allowNull: true },
        next_attempt_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      TABLE_OPTIONS,
    );
    // The same file is queued once, even if the orphan job and a record deletion both find it.
    await queryInterface.addIndex('pending_file_deletions', ['public_id', 'resource_type', 'delivery_type'], {
      name: 'uq_pending_file_deletions_asset',
      unique: true,
    });
    // Worker poll: status = 'pending' AND next_attempt_at <= now, oldest first. Also lists 'failed' rows for review.
    await queryInterface.addIndex('pending_file_deletions', ['status', 'next_attempt_at'], {
      name: 'idx_pending_file_deletions_status_next_attempt_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pending_file_deletions');
  },
};
