'use strict';

// Property files (PROP-DEC-013, PROP-SPEC-001): gallery videos and 360 tours are Cloudinary 'video' assets,
// and replacing a property document's file queues the old one with reason 'replaced'. Both ENUMs only gain
// a value, so no existing row changes. `down` refuses while a row still uses a new value, instead of letting
// MySQL fail on (or blank) it.

const RESOURCE_TYPES = ['image', 'raw'];
const REASONS = ['save_failed', 'record_deleted', 'orphan'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('pending_file_deletions', 'resource_type', {
      type: Sequelize.ENUM(...RESOURCE_TYPES, 'video'),
      allowNull: false,
    });
    await queryInterface.changeColumn('pending_file_deletions', 'reason', {
      type: Sequelize.ENUM(...REASONS, 'replaced'),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    const [[{ count }]] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) AS count FROM pending_file_deletions WHERE resource_type = 'video' OR reason = 'replaced'",
    );
    if (Number(count) > 0) {
      throw new Error(
        `pending_file_deletions has ${count} row(s) with resource_type 'video' or reason 'replaced'; let the worker delete them first.`,
      );
    }
    await queryInterface.changeColumn('pending_file_deletions', 'reason', {
      type: Sequelize.ENUM(...REASONS),
      allowNull: false,
    });
    await queryInterface.changeColumn('pending_file_deletions', 'resource_type', {
      type: Sequelize.ENUM(...RESOURCE_TYPES),
      allowNull: false,
    });
  },
};
