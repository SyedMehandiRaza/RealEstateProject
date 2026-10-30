'use strict';

// Property module tables. DRAFT, not yet approved: see docs/modules/property/db.md (ASSUMED items) and the
// open questions in docs/execution/property/questions/ (PROP-Q-001 to PROP-Q-016).
// Creates, in FK order: properties, property_configurations, property_configuration_floor_plans,
// property_media, property_documents, property_features, property_construction_progress, property_updates,
// property_amenities, property_amenity_plans.
//
// Depends on the auth migration (users). The staff migration (next timestamp) references `properties`.
//
// Transactions: MySQL DDL commits implicitly, so a transaction would not make this migration atomic. If `up`
// fails midway, run `down` (dropTable issues DROP TABLE IF EXISTS) and retry.
//
// Requires MySQL 8.0.16+ for CHECK constraints (DEC-020); REGEXP_LIKE is MySQL 8 only.
// Indexes are created before their FKs so MySQL reuses them instead of adding implicit FK indexes.
// Every VARCHAR length equals the Zod `max` proposed in docs/modules/property/db.md.
//
// Files (images, videos, PDFs) follow the Cloudinary pattern of DEC-016/DEC-018: store the public id and
// resource type, never a URL; deletions go through pending_file_deletions. Videos need resource_type
// 'video', which pending_file_deletions does not accept yet (PROP-Q-011).

const TABLE_OPTIONS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' };

// Cloudinary public ids are case-sensitive, so they compare byte for byte.
const UTF8_BIN = 'CHARACTER SET utf8mb4 COLLATE utf8mb4_bin';

const MB = 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * MB; // "Max size: 10 MB" (images, PDFs)
const MAX_VIDEO_BYTES = 40 * MB; // "Max size: 40 MB" (mp4, 360° video)

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

// One uploaded file: PDF/JPG/PNG up to 10 MB (images as 'image', PDFs as 'raw', like verification_documents).
const documentFileColumns = (Sequelize, { allowNull }) => ({
  cloudinary_public_id: { type: `VARCHAR(255) ${UTF8_BIN}`, allowNull },
  cloudinary_resource_type: { type: Sequelize.ENUM('image', 'raw'), allowNull },
  original_filename: { type: Sequelize.STRING(255), allowNull },
  mime_type: { type: Sequelize.ENUM('application/pdf', 'image/jpeg', 'image/png'), allowNull },
  size_bytes: { type: Sequelize.INTEGER.UNSIGNED, allowNull },
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

// The CHECKs every document-file table shares (size, and PDF <=> 'raw').
async function addDocumentFileChecks(queryInterface, table) {
  await addCheck(
    queryInterface,
    table,
    `chk_${table}_size`,
    `\`size_bytes\` BETWEEN 1 AND ${MAX_DOCUMENT_BYTES}`,
  );
  await addCheck(
    queryInterface,
    table,
    `chk_${table}_resource_type`,
    "(`mime_type` = 'application/pdf') = (`cloudinary_resource_type` = 'raw')",
  );
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // ------------------------------------------------------------- properties
    // Frames: add Property steps 1-2 (13009:10644, 13009:10825), Review & Submit (13009:11344),
    // My Property (13009:7145), Property Detail overview (13009:7369).
    await queryInterface.createTable(
      'properties',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        // The Developer account that listed the property (PROP-Q-001).
        owner_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        name: { type: Sequelize.STRING(150), allowNull: false },
        // Must equal PROPERTY_TYPES in shared (dropdown 13009:12418).
        property_type: {
          type: Sequelize.ENUM(
            'apartment',
            'villa',
            'studio',
            'farmland',
            'townhouse',
            'plot',
            'shops',
            'duplex',
          ),
          allowNull: false,
        },
        // Dropdown 13009:12390: For Sale / For Rent.
        listing_purpose: { type: Sequelize.ENUM('sale', 'rent'), allowNull: false },
        // Dropdown 13009:12396: Single Property / Project.
        listing_category: { type: Sequelize.ENUM('single_property', 'project'), allowNull: false },
        // "Property Status": only these two values are visible (PROP-Q-004).
        property_status: { type: Sequelize.ENUM('ready_to_move', 'under_construction'), allowNull: false },
        // ISO 3166-1 alpha-2, like users.preferred_country_code (DEC-012). State/city lists: PROP-Q-005.
        country_code: { type: Sequelize.CHAR(2), allowNull: false },
        state: { type: Sequelize.STRING(100), allowNull: false },
        city: { type: Sequelize.STRING(100), allowNull: false },
        locality: { type: Sequelize.STRING(150), allowNull: false },
        postal_code: { type: Sequelize.STRING(10), allowNull: false },
        address: { type: Sequelize.STRING(255), allowNull: false },
        // "Pin Location on Map". 6 decimals = about 0.1 m.
        latitude: { type: Sequelize.DECIMAL(8, 6), allowNull: false },
        longitude: { type: Sequelize.DECIMAL(9, 6), allowNull: false },
        // "Total Area": "3 Acres" on Review & Submit, sq.ft on configurations (PROP-Q-006).
        total_area: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        total_area_unit: { type: Sequelize.ENUM('sq_ft', 'acre'), allowNull: false },
        total_units: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        tower_count: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false },
        floor_count: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false },
        // Money in one currency for now (PROP-Q-007).
        starting_price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        year_built: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false },
        builder_name: { type: Sequelize.STRING(150), allowNull: false },
        // Long free text (Zod max 5000).
        description: { type: Sequelize.TEXT, allowNull: false },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    // My Properties: the owner's list, newest first; also serves the FK on owner_id.
    await queryInterface.addIndex('properties', ['owner_id', 'created_at'], {
      name: 'idx_properties_owner_id_created_at',
    });
    // "Search property" on My Properties (prefix search on the name, inside the owner's list).
    await queryInterface.addIndex('properties', ['owner_id', 'name'], {
      name: 'idx_properties_owner_id_name',
    });
    await addForeignKey(queryInterface, 'properties', 'owner_id', 'fk_properties_users', 'users', 'RESTRICT');
    await addCheck(queryInterface, 'properties', 'chk_properties_name', "TRIM(`name`) <> ''");
    await addCheck(
      queryInterface,
      'properties',
      'chk_properties_country_code',
      "REGEXP_LIKE(`country_code`, '^[A-Z]{2}$', 'c')",
    );
    await addCheck(
      queryInterface,
      'properties',
      'chk_properties_postal_code',
      "REGEXP_LIKE(`postal_code`, '^[A-Za-z0-9][A-Za-z0-9 -]{1,8}[A-Za-z0-9]$')",
    );
    await addCheck(
      queryInterface,
      'properties',
      'chk_properties_coordinates',
      '`latitude` BETWEEN -90 AND 90 AND `longitude` BETWEEN -180 AND 180',
    );
    await addCheck(queryInterface, 'properties', 'chk_properties_total_area', '`total_area` > 0');
    await addCheck(
      queryInterface,
      'properties',
      'chk_properties_counts',
      '`total_units` >= 1 AND `tower_count` >= 1 AND `floor_count` >= 1',
    );
    await addCheck(queryInterface, 'properties', 'chk_properties_starting_price', '`starting_price` > 0');
    await addCheck(
      queryInterface,
      'properties',
      'chk_properties_year_built',
      '`year_built` BETWEEN 1800 AND 2100',
    );

    // ------------------------------------------------ property_configurations
    // Frames: Configuration tab (13009:9932), Add Configuration (13009:10479), add Property step 3 (13009:10940).
    await queryInterface.createTable(
      'property_configurations',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        property_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        // "Configuration Name" / "Unit Type", e.g. "2 BHK Apartment".
        name: { type: Sequelize.STRING(100), allowNull: false },
        area_sqft: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        total_units: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        available_units: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        // Only "Active" is visible (PROP-Q-009).
        status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    // One "2 BHK" per property (PROP-Q-014); also serves the FK on property_id.
    await queryInterface.addIndex('property_configurations', ['property_id', 'name'], {
      name: 'uq_property_configurations_property_id_name',
      unique: true,
    });
    await addForeignKey(
      queryInterface,
      'property_configurations',
      'property_id',
      'fk_property_configurations_properties',
      'properties',
      'CASCADE',
    );
    await addCheck(
      queryInterface,
      'property_configurations',
      'chk_property_configurations_name',
      "TRIM(`name`) <> ''",
    );
    await addCheck(
      queryInterface,
      'property_configurations',
      'chk_property_configurations_area',
      '`area_sqft` > 0',
    );
    await addCheck(
      queryInterface,
      'property_configurations',
      'chk_property_configurations_price',
      '`price` > 0',
    );
    await addCheck(
      queryInterface,
      'property_configurations',
      'chk_property_configurations_units',
      '`total_units` >= 1 AND `available_units` <= `total_units`',
    );

    // ------------------------------------- property_configuration_floor_plans
    // "Floor plan & layout": several files per configuration, plus an Upload tile (13009:9932, 13009:10479).
    await queryInterface.createTable(
      'property_configuration_floor_plans',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        property_configuration_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        ...documentFileColumns(Sequelize, { allowNull: false }),
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('property_configuration_floor_plans', ['cloudinary_public_id'], {
      name: 'uq_property_configuration_floor_plans_cloudinary_public_id',
      unique: true,
    });
    await queryInterface.addIndex(
      'property_configuration_floor_plans',
      ['property_configuration_id', 'created_at'],
      {
        name: 'idx_property_configuration_floor_plans_config_id_created_at',
      },
    );
    await addForeignKey(
      queryInterface,
      'property_configuration_floor_plans',
      'property_configuration_id',
      'fk_property_configuration_floor_plans_property_configurations',
      'property_configurations',
      'CASCADE',
    );
    await addDocumentFileChecks(queryInterface, 'property_configuration_floor_plans');

    // --------------------------------------------------------- property_media
    // Gallery: add Property step 4 (13009:11051), Gallery + upload (13009:7369, 13009:7612, 13009:12032),
    // full-screen viewer (13009:12356), card image on My Property (13009:7145).
    await queryInterface.createTable(
      'property_media',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        property_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        // "Property Images", "Videos", "360° Tour".
        media_type: { type: Sequelize.ENUM('image', 'video', 'tour_360'), allowNull: false },
        cloudinary_public_id: { type: `VARCHAR(255) ${UTF8_BIN}`, allowNull: false },
        cloudinary_resource_type: { type: Sequelize.ENUM('image', 'video'), allowNull: false },
        original_filename: { type: Sequelize.STRING(255), allowNull: false },
        mime_type: { type: Sequelize.ENUM('image/jpeg', 'image/png', 'video/mp4'), allowNull: false },
        size_bytes: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        // Gallery order ("2/12"); the first image is the cover (PROP-Q-016).
        sort_order: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('property_media', ['cloudinary_public_id'], {
      name: 'uq_property_media_cloudinary_public_id',
      unique: true,
    });
    // Gallery and cover image in order; also serves the FK on property_id.
    await queryInterface.addIndex('property_media', ['property_id', 'media_type', 'sort_order'], {
      name: 'idx_property_media_property_id_type_sort_order',
    });
    await addForeignKey(
      queryInterface,
      'property_media',
      'property_id',
      'fk_property_media_properties',
      'properties',
      'CASCADE',
    );
    await addCheck(
      queryInterface,
      'property_media',
      'chk_property_media_mime_type',
      "(`media_type` = 'image') = (`mime_type` IN ('image/jpeg', 'image/png'))",
    );
    await addCheck(
      queryInterface,
      'property_media',
      'chk_property_media_resource_type',
      "(`media_type` = 'image') = (`cloudinary_resource_type` = 'image')",
    );
    await addCheck(
      queryInterface,
      'property_media',
      'chk_property_media_size',
      `\`size_bytes\` BETWEEN 1 AND IF(\`media_type\` = 'image', ${MAX_DOCUMENT_BYTES}, ${MAX_VIDEO_BYTES})`,
    );

    // ----------------------------------------------------- property_documents
    // Frames: add Property step 5 (13009:11196), Documents tab (13009:10202), Replace Document (13009:12013).
    await queryInterface.createTable(
      'property_documents',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        property_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        // Upload slots of step 5, plus "Financial" seen in the Documents tab (PROP-Q-010).
        document_type: {
          type: Sequelize.ENUM(
            'rera_certificate',
            'floor_plan',
            'legal_noc',
            'ownership_proof',
            'financial_statement',
            'other',
          ),
          allowNull: false,
        },
        // Badges in the Documents tab; meaning and who changes them: PROP-Q-010.
        status: {
          type: Sequelize.ENUM('uploaded', 'pending', 'verified'),
          allowNull: false,
          defaultValue: 'uploaded',
        },
        ...documentFileColumns(Sequelize, { allowNull: false }),
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('property_documents', ['cloudinary_public_id'], {
      name: 'uq_property_documents_cloudinary_public_id',
      unique: true,
    });
    // "All Category" filter (category is derived from document_type); also serves the FK on property_id.
    await queryInterface.addIndex('property_documents', ['property_id', 'document_type'], {
      name: 'idx_property_documents_property_id_document_type',
    });
    // "All Status" filter.
    await queryInterface.addIndex('property_documents', ['property_id', 'status'], {
      name: 'idx_property_documents_property_id_status',
    });
    await addForeignKey(
      queryInterface,
      'property_documents',
      'property_id',
      'fk_property_documents_properties',
      'properties',
      'CASCADE',
    );
    await addDocumentFileChecks(queryInterface, 'property_documents');

    // ------------------------------------------------------ property_features
    // "Amenities" (add Property step 2, 13009:10825) shown as "Amenities & Features" (13009:7369) (PROP-Q-008).
    await queryInterface.createTable(
      'property_features',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        property_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        name: { type: Sequelize.STRING(100), allowNull: false },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    // No duplicate feature per property; also serves the FK on property_id.
    await queryInterface.addIndex('property_features', ['property_id', 'name'], {
      name: 'uq_property_features_property_id_name',
      unique: true,
    });
    await addForeignKey(
      queryInterface,
      'property_features',
      'property_id',
      'fk_property_features_properties',
      'properties',
      'CASCADE',
    );
    await addCheck(queryInterface, 'property_features', 'chk_property_features_name', "TRIM(`name`) <> ''");

    // ------------------------------------------- property_construction_progress
    // One row per under-construction property: Project Overview (13009:7876) and Update Progress (13009:10526).
    // Phase badges (Complete / In progress) are derived from the percentages (PROP-Q-013).
    await queryInterface.createTable(
      'property_construction_progress',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        property_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        overall_percent: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        foundation_percent: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        structure_percent: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        interior_percent: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        finishing_percent: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        // "Possession Date" (Dec 2026): no input field is designed yet (PROP-Q-013).
        possession_date: { type: Sequelize.DATEONLY, allowNull: true },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('property_construction_progress', ['property_id'], {
      name: 'uq_property_construction_progress_property_id',
      unique: true,
    });
    await addForeignKey(
      queryInterface,
      'property_construction_progress',
      'property_id',
      'fk_property_construction_progress_properties',
      'properties',
      'CASCADE',
    );
    await addCheck(
      queryInterface,
      'property_construction_progress',
      'chk_property_construction_progress_percent',
      '`overall_percent` <= 100 AND `foundation_percent` <= 100 AND `structure_percent` <= 100' +
        ' AND `interior_percent` <= 100 AND `finishing_percent` <= 100',
    );

    // ------------------------------------------------------- property_updates
    // Updates tab (13009:7876) and Add Update (13009:10615): title, description, optional image, date.
    await queryInterface.createTable(
      'property_updates',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        property_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        title: { type: Sequelize.STRING(150), allowNull: false },
        description: { type: Sequelize.STRING(2000), allowNull: false },
        // "Upload Image (optional)": all five file columns are set together or all NULL.
        ...documentFileColumns(Sequelize, { allowNull: true }),
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    await queryInterface.addIndex('property_updates', ['cloudinary_public_id'], {
      name: 'uq_property_updates_cloudinary_public_id',
      unique: true,
    });
    // Updates list, newest first; also serves the FK on property_id.
    await queryInterface.addIndex('property_updates', ['property_id', 'created_at'], {
      name: 'idx_property_updates_property_id_created_at',
    });
    await addForeignKey(
      queryInterface,
      'property_updates',
      'property_id',
      'fk_property_updates_properties',
      'properties',
      'CASCADE',
    );
    await addCheck(
      queryInterface,
      'property_updates',
      'chk_property_updates_text',
      "TRIM(`title`) <> '' AND TRIM(`description`) <> ''",
    );
    await addCheck(
      queryInterface,
      'property_updates',
      'chk_property_updates_file_all_or_none',
      '(`cloudinary_public_id` IS NULL) = (`cloudinary_resource_type` IS NULL)' +
        ' AND (`cloudinary_public_id` IS NULL) = (`original_filename` IS NULL)' +
        ' AND (`cloudinary_public_id` IS NULL) = (`mime_type` IS NULL)' +
        ' AND (`cloudinary_public_id` IS NULL) = (`size_bytes` IS NULL)',
    );
    // A NULL CHECK result passes, so these hold only when a file is attached.
    await addDocumentFileChecks(queryInterface, 'property_updates');

    // ------------------------------------------------------ property_amenities
    // Bookable amenities: Amenity tab (13009:8335), Add / Edit (13009:11821, 13009:11898),
    // Delete (13009:12402, "permanent"), success (13009:11589) (PROP-Q-012).
    await queryInterface.createTable(
      'property_amenities',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        property_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        name: { type: Sequelize.STRING(100), allowNull: false },
        // List "Category" column: Sports, Event, Parking.
        category: { type: Sequelize.ENUM('sports', 'event', 'parking'), allowNull: false },
        // List "Type" column: Monthly (subscription) / Time Based.
        pricing_type: { type: Sequelize.ENUM('subscription', 'time_based'), allowNull: false },
        description: { type: Sequelize.STRING(1000), allowNull: false },
        features: { type: Sequelize.STRING(1000), allowNull: false },
        status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    // One "Gym" per property; also serves the FK and the name search.
    await queryInterface.addIndex('property_amenities', ['property_id', 'name'], {
      name: 'uq_property_amenities_property_id_name',
      unique: true,
    });
    // "All Status" filter.
    await queryInterface.addIndex('property_amenities', ['property_id', 'status'], {
      name: 'idx_property_amenities_property_id_status',
    });
    await addForeignKey(
      queryInterface,
      'property_amenities',
      'property_id',
      'fk_property_amenities_properties',
      'properties',
      'CASCADE',
    );
    await addCheck(queryInterface, 'property_amenities', 'chk_property_amenities_name', "TRIM(`name`) <> ''");

    // -------------------------------------------------- property_amenity_plans
    // "Subscription": Plan, Billing Cycle, Price, Feature; list "Pricing": "$100", "$10hr / $40day".
    await queryInterface.createTable(
      'property_amenity_plans',
      {
        id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
        property_amenity_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
        plan_name: { type: Sequelize.STRING(50), allowNull: false },
        billing_cycle: { type: Sequelize.ENUM('hour', 'day', 'month'), allowNull: false },
        price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        features: { type: Sequelize.STRING(255), allowNull: true },
        ...timestamps(Sequelize),
      },
      TABLE_OPTIONS,
    );
    // One price per plan and cycle; also serves the FK on property_amenity_id.
    await queryInterface.addIndex(
      'property_amenity_plans',
      ['property_amenity_id', 'plan_name', 'billing_cycle'],
      {
        name: 'uq_property_amenity_plans_amenity_id_plan_name_cycle',
        unique: true,
      },
    );
    await addForeignKey(
      queryInterface,
      'property_amenity_plans',
      'property_amenity_id',
      'fk_property_amenity_plans_property_amenities',
      'property_amenities',
      'CASCADE',
    );
    await addCheck(
      queryInterface,
      'property_amenity_plans',
      'chk_property_amenity_plans_plan_name',
      "TRIM(`plan_name`) <> ''",
    );
    await addCheck(
      queryInterface,
      'property_amenity_plans',
      'chk_property_amenity_plans_price',
      '`price` >= 0',
    );
  },

  async down(queryInterface) {
    // Reverse FK order; only this module's tables. Dropping a table also drops its indexes, FKs and CHECKs.
    // The staff tables reference `properties`: undo the staff migration first (it has the later timestamp).
    await queryInterface.dropTable('property_amenity_plans');
    await queryInterface.dropTable('property_amenities');
    await queryInterface.dropTable('property_updates');
    await queryInterface.dropTable('property_construction_progress');
    await queryInterface.dropTable('property_features');
    await queryInterface.dropTable('property_documents');
    await queryInterface.dropTable('property_media');
    await queryInterface.dropTable('property_configuration_floor_plans');
    await queryInterface.dropTable('property_configurations');
    await queryInterface.dropTable('properties');
  },
};
