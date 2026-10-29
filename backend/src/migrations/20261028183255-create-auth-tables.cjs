'use strict';

// Auth module tables (buyer + developer scope; agent deferred). DRAFT, not yet approved: see docs/modules/auth/db.md (ASSUMED items and open questions).
// Creates, in FK order: users, user_roles, refresh_tokens, verification_codes, professional_profiles,
// verification_documents. One account (one email) can hold several roles, e.g. buyer and developer (Q-031).
//
// Transactions: MySQL DDL (CREATE/ALTER/DROP TABLE) commits implicitly, so a transaction would not make this
// migration atomic. If `up` fails midway, run `down` (Sequelize's dropTable issues DROP TABLE IF EXISTS) and retry.
//
// Requires MySQL 8.0.16+ for CHECK constraints to be enforced (Q-004); REGEXP_LIKE is MySQL 8 only.
// Indexes are created before their FKs so MySQL reuses them instead of adding implicit FK indexes.
// Every VARCHAR length equals the Zod `max` proposed in docs/modules/auth/db.md.

const TABLE_OPTIONS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' };

// Case-sensitive columns. Hex hashes and UUIDs are ASCII: ascii_bin keeps their indexes small.
// Cloudinary public ids are case-sensitive, so they compare byte for byte.
const ASCII_BIN = 'CHARACTER SET ascii COLLATE ascii_bin';
const UTF8_BIN = 'CHARACTER SET utf8mb4 COLLATE utf8mb4_bin';

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
    // ------------------------------------------------------------------ users
    await queryInterface.createTable(
      'users',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        full_name: { type: Sequelize.STRING(100), allowNull: false },
        email: { type: Sequelize.STRING(254), allowNull: false },
        phone: { type: Sequelize.STRING(16), allowNull: false },
        password_hash: { type: Sequelize.STRING(255), allowNull: false },
        email_verified_at: { type: Sequelize.DATE, allowNull: true },
        preferred_country_code: { type: Sequelize.CHAR(2), allowNull: true },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('users', ['email'], { name: 'uq_users_email', unique: true });
    await addCheck(
      queryInterface,
      'users',
      'chk_users_phone_e164',
      "REGEXP_LIKE(`phone`, '^[+][1-9][0-9]{6,14}$')",
    );
    await addCheck(
      queryInterface,
      'users',
      'chk_users_preferred_country_code',
      "`preferred_country_code` IS NULL OR REGEXP_LIKE(`preferred_country_code`, '^[A-Z]{2}$', 'c')",
    );

    // ------------------------------------------------------------- user_roles
    await queryInterface.createTable(
      'user_roles',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        // Must equal USER_ROLES in shared/src/enums/auth.enums.js.
        role: { type: Sequelize.ENUM('buyer', 'developer', 'admin'), allowNull: false },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('user_roles', ['user_id', 'role'], {
      name: 'uq_user_roles_user_id_role',
      unique: true,
    });
    await queryInterface.addIndex('user_roles', ['role', 'user_id'], { name: 'idx_user_roles_role_user_id' });
    await addForeignKey(queryInterface, 'user_roles', 'user_id', 'fk_user_roles_users', 'users', 'CASCADE');

    // --------------------------------------------------------- refresh_tokens
    await queryInterface.createTable(
      'refresh_tokens',
      {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        jti: { type: `CHAR(36) ${ASCII_BIN}`, allowNull: false },
        token_hash: { type: `CHAR(64) ${ASCII_BIN}`, allowNull: false },
        expires_at: { type: Sequelize.DATE, allowNull: false },
        revoked_at: { type: Sequelize.DATE, allowNull: true },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('refresh_tokens', ['jti'], { name: 'uq_refresh_tokens_jti', unique: true });
    await queryInterface.addIndex('refresh_tokens', ['token_hash'], {
      name: 'uq_refresh_tokens_token_hash',
      unique: true,
    });
    await queryInterface.addIndex('refresh_tokens', ['user_id', 'revoked_at'], {
      name: 'idx_refresh_tokens_user_id_revoked_at',
    });
    await queryInterface.addIndex('refresh_tokens', ['expires_at'], {
      name: 'idx_refresh_tokens_expires_at',
    });
    await addForeignKey(
      queryInterface,
      'refresh_tokens',
      'user_id',
      'fk_refresh_tokens_users',
      'users',
      'CASCADE',
    );

    // ----------------------------------------------------- verification_codes
    await queryInterface.createTable(
      'verification_codes',
      {
        id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        purpose: { type: Sequelize.ENUM('email_verification', 'password_reset'), allowNull: false },
        code_hash: { type: `CHAR(64) ${ASCII_BIN}`, allowNull: false },
        expires_at: { type: Sequelize.DATE, allowNull: false },
        attempts: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        used_at: { type: Sequelize.DATE, allowNull: true },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('verification_codes', ['user_id', 'purpose', 'created_at'], {
      name: 'idx_verification_codes_user_id_purpose_created_at',
    });
    await queryInterface.addIndex('verification_codes', ['expires_at'], {
      name: 'idx_verification_codes_expires_at',
    });
    await addForeignKey(
      queryInterface,
      'verification_codes',
      'user_id',
      'fk_verification_codes_users',
      'users',
      'CASCADE',
    );
    await addCheck(
      queryInterface,
      'verification_codes',
      'chk_verification_codes_expiry',
      '`expires_at` > `created_at`',
    );

    // -------------------------------------------------- professional_profiles
    await queryInterface.createTable(
      'professional_profiles',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        organization_name: { type: Sequelize.STRING(150), allowNull: true },
        business_type: { type: Sequelize.ENUM('individual', 'company'), allowNull: false },
        license_number: { type: Sequelize.STRING(50), allowNull: false },
        experience_level: { type: Sequelize.ENUM('0_2', '3_5', '6_10', '10_plus'), allowNull: false },
        location: { type: Sequelize.STRING(150), allowNull: false },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('professional_profiles', ['user_id'], {
      name: 'uq_professional_profiles_user_id',
      unique: true,
    });
    await addForeignKey(
      queryInterface,
      'professional_profiles',
      'user_id',
      'fk_professional_profiles_users',
      'users',
      'CASCADE',
    );

    // ------------------------------------------------- verification_documents
    await queryInterface.createTable(
      'verification_documents',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        professional_profile_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        document_kind: {
          type: Sequelize.ENUM('government_id', 'company_registration_certificate', 'profile_photo'),
          allowNull: false,
        },
        id_document_type: {
          type: Sequelize.ENUM('driving_license', 'passport', 'pan_card'),
          allowNull: true,
        },
        // Cloudinary asset, uploaded with type 'authenticated' (never public). No URL is stored: the
        // backend signs a short-lived delivery URL on demand. resource_type is needed to sign and destroy.
        cloudinary_public_id: { type: `VARCHAR(255) ${UTF8_BIN}`, allowNull: false },
        cloudinary_resource_type: { type: Sequelize.ENUM('image', 'raw'), allowNull: false },
        original_filename: { type: Sequelize.STRING(255), allowNull: false },
        mime_type: { type: Sequelize.ENUM('application/pdf', 'image/jpeg', 'image/png'), allowNull: false },
        size_bytes: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        status: {
          type: Sequelize.ENUM('pending', 'approved', 'rejected'),
          allowNull: false,
          defaultValue: 'pending',
        },
        rejection_reason: { type: Sequelize.STRING(500), allowNull: true },
        reviewed_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
        reviewed_at: { type: Sequelize.DATE, allowNull: true },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('verification_documents', ['cloudinary_public_id'], {
      name: 'uq_verification_documents_cloudinary_public_id',
      unique: true,
    });
    await queryInterface.addIndex(
      'verification_documents',
      ['professional_profile_id', 'document_kind', 'created_at'],
      {
        name: 'idx_verification_documents_profile_kind_created_at',
      },
    );
    await queryInterface.addIndex('verification_documents', ['status', 'created_at'], {
      name: 'idx_verification_documents_status_created_at',
    });
    await queryInterface.addIndex('verification_documents', ['reviewed_by'], {
      name: 'idx_verification_documents_reviewed_by',
    });
    await addForeignKey(
      queryInterface,
      'verification_documents',
      'professional_profile_id',
      'fk_verification_documents_professional_profiles',
      'professional_profiles',
      'CASCADE',
    );
    await addForeignKey(
      queryInterface,
      'verification_documents',
      'reviewed_by',
      'fk_verification_documents_reviewed_by_users',
      'users',
      'SET NULL',
    );
    // reviewed_by is deliberately absent from every CHECK: MySQL rejects a CHECK on a column that an
    // ON DELETE SET NULL foreign key writes to.
    await addCheck(
      queryInterface,
      'verification_documents',
      'chk_verification_documents_id_type',
      "(`document_kind` = 'government_id') = (`id_document_type` IS NOT NULL)",
    );
    await addCheck(
      queryInterface,
      'verification_documents',
      'chk_verification_documents_size',
      '`size_bytes` BETWEEN 1 AND 10485760',
    );
    // PDFs go to Cloudinary as 'raw' (no transformations, not subject to PDF delivery limits); JPG/PNG as 'image'.
    await addCheck(
      queryInterface,
      'verification_documents',
      'chk_verification_documents_resource_type',
      "(`mime_type` = 'application/pdf') = (`cloudinary_resource_type` = 'raw')",
    );
    // Profile Photo must be an image (DEC-021); ID and certificate also accept PDF.
    await addCheck(
      queryInterface,
      'verification_documents',
      'chk_verification_documents_profile_photo_type',
      "`document_kind` <> 'profile_photo' OR `mime_type` IN ('image/jpeg', 'image/png')",
    );
    await addCheck(
      queryInterface,
      'verification_documents',
      'chk_verification_documents_rejection_reason',
      "(`status` = 'rejected') = (`rejection_reason` IS NOT NULL)",
    );
    await addCheck(
      queryInterface,
      'verification_documents',
      'chk_verification_documents_reviewed_at',
      "(`status` = 'pending') = (`reviewed_at` IS NULL)",
    );
  },

  async down(queryInterface) {
    // Reverse FK order. Dropping a table also drops its indexes, foreign keys and CHECK constraints.
    await queryInterface.dropTable('verification_documents');
    await queryInterface.dropTable('professional_profiles');
    await queryInterface.dropTable('verification_codes');
    await queryInterface.dropTable('refresh_tokens');
    await queryInterface.dropTable('user_roles');
    await queryInterface.dropTable('users');
  },
};
