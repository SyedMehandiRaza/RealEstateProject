'use strict';

// Staff module tables. DRAFT, not yet approved: see docs/modules/staff/db.md (ASSUMED items) and the open
// questions in docs/execution/staff/questions/ (STAFF-Q-001 to STAFF-Q-008).
// Creates, in FK order: staff_members, staff_member_permissions, staff_property_assignments.
//
// Depends on the auth migration (users) and on the property migration (20261030212741-create-property-tables,
// for `properties`). Cross-module FK: staff_property_assignments.property_id -> properties.id (the only one).
//
// Transactions: MySQL DDL commits implicitly, so a transaction would not make this migration atomic. If `up`
// fails midway, run `down` (dropTable issues DROP TABLE IF EXISTS) and retry.
//
// Requires MySQL 8.0.16+ for CHECK constraints (DEC-020); REGEXP_LIKE is MySQL 8 only.
// Indexes are created before their FKs so MySQL reuses them instead of adding implicit FK indexes.
// Every VARCHAR length equals the Zod `max` proposed in docs/modules/staff/db.md.

const TABLE_OPTIONS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' };

const timestamps = (Sequelize) => ({
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
});

// Static SQL only: table, name and expression are constants in this file, never user input.
async function addCheck(queryInterface, table, name, expression) {
  await queryInterface.sequelize.query(
    `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${name}\` CHECK (${expression})`,
  );
}

function addForeignKey(queryInterface, table, column, name, refTable, onDelete) {
  return queryInterface.addConstraint(table, {
    fields: [column],
    type: 'foreign key',
    name,
    references: { table: refTable, field: 'id' },
    onDelete,
    onUpdate: 'RESTRICT',
  });
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // ---------------------------------------------------------- staff_members
    // Frames: Staff Management list (13009:17816), Add Staff (13009:18190), staff Detail (13009:18226).
    await queryInterface.createTable(
      'staff_members',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        // The account that added this staff member and manages them (STAFF-Q-007).
        employer_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        // The staff member's own login account, once they have one (STAFF-Q-001). NULL until then.
        user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        // Same lengths and formats as users.full_name / email / phone, so a staff member can become a user.
        full_name: { type: Sequelize.STRING(100), allowNull: false },
        // Stored lowercase (like users.email, DEC-021).
        email: { type: Sequelize.STRING(254), allowNull: false },
        phone: { type: Sequelize.STRING(16), allowNull: false },
        // Must equal STAFF_ROLES in shared. Only "Agent" is visible (STAFF-Q-002).
        role: { type: Sequelize.ENUM('agent'), allowNull: false },
        // List and Detail: Active / Disable.
        status: { type: Sequelize.ENUM('active', 'disabled'), allowNull: false, defaultValue: 'active' },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    // One staff record per email for each employer (STAFF-Q-005); also serves the FK on employer_id.
    await queryInterface.addIndex('staff_members', ['employer_id', 'email'], {
      name: 'uq_staff_members_employer_id_email',
      unique: true,
    });
    // Staff List, newest first.
    await queryInterface.addIndex('staff_members', ['employer_id', 'created_at'], {
      name: 'idx_staff_members_employer_id_created_at',
    });
    // Finds the staff records of a logged-in account; also serves the FK on user_id.
    await queryInterface.addIndex('staff_members', ['user_id'], { name: 'idx_staff_members_user_id' });
    await addForeignKey(
      queryInterface,
      'staff_members',
      'employer_id',
      'fk_staff_members_employer_users',
      'users',
      'CASCADE',
    );
    await addForeignKey(
      queryInterface,
      'staff_members',
      'user_id',
      'fk_staff_members_users',
      'users',
      'SET NULL',
    );
    // user_id is deliberately absent from every CHECK: MySQL rejects a CHECK on a column that an
    // ON DELETE SET NULL foreign key writes to.
    await addCheck(queryInterface, 'staff_members', 'chk_staff_members_full_name', "TRIM(`full_name`) <> ''");
    await addCheck(
      queryInterface,
      'staff_members',
      'chk_staff_members_email_lowercase',
      // Compared byte for byte: under the table's case-insensitive collation `email` = LOWER(`email`) is always true.
      '`email` COLLATE utf8mb4_bin = LOWER(`email`) COLLATE utf8mb4_bin',
    );
    await addCheck(
      queryInterface,
      'staff_members',
      'chk_staff_members_phone_e164',
      "REGEXP_LIKE(`phone`, '^[+][1-9][0-9]{6,14}$')",
    );

    // ----------------------------------------------- staff_member_permissions
    // "Assign Access Permissions" (Add Staff) and "Assigned Permissions / Access" (Detail): one row per
    // granted area; an area without a row is shown with the red cross (STAFF-Q-003).
    await queryInterface.createTable(
      'staff_member_permissions',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        staff_member_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        // Must equal STAFF_PERMISSIONS in shared.
        permission: {
          type: Sequelize.ENUM(
            'properties_management',
            'leads_crm',
            'payment_tracking',
            'marketing',
            'facility_management',
          ),
          allowNull: false,
        },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('staff_member_permissions', ['staff_member_id', 'permission'], {
      name: 'uq_staff_member_permissions_staff_member_id_permission',
      unique: true,
    });
    await addForeignKey(
      queryInterface,
      'staff_member_permissions',
      'staff_member_id',
      'fk_staff_member_permissions_staff_members',
      'staff_members',
      'CASCADE',
    );

    // --------------------------------------------- staff_property_assignments
    // "Assigned Property" card and "Assign Property" button (Detail, 13009:18226) (STAFF-Q-006).
    await queryInterface.createTable(
      'staff_property_assignments',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        staff_member_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        // Cross-module FK to the property module's table.
        property_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    // A property is assigned to a staff member once; also serves the FK on staff_member_id.
    await queryInterface.addIndex('staff_property_assignments', ['staff_member_id', 'property_id'], {
      name: 'uq_staff_property_assignments_staff_member_id_property_id',
      unique: true,
    });
    // Staff assigned to a property; also serves the FK on property_id.
    await queryInterface.addIndex('staff_property_assignments', ['property_id'], {
      name: 'idx_staff_property_assignments_property_id',
    });
    await addForeignKey(
      queryInterface,
      'staff_property_assignments',
      'staff_member_id',
      'fk_staff_property_assignments_staff_members',
      'staff_members',
      'CASCADE',
    );
    await addForeignKey(
      queryInterface,
      'staff_property_assignments',
      'property_id',
      'fk_staff_property_assignments_properties',
      'properties',
      'CASCADE',
    );
  },

  async down(queryInterface) {
    // Reverse FK order; only this module's tables. Dropping a table also drops its indexes, FKs and CHECKs.
    await queryInterface.dropTable('staff_property_assignments');
    await queryInterface.dropTable('staff_member_permissions');
    await queryInterface.dropTable('staff_members');
  },
};
