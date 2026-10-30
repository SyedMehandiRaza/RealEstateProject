import path from 'node:path';
import { Sequelize } from 'sequelize';
import { defineProperty } from '../property.model.js';
import { definePropertyAmenity } from '../propertyAmenity.model.js';
import { definePropertyAmenityPlan } from '../propertyAmenityPlan.model.js';
import { definePropertyConfiguration } from '../propertyConfiguration.model.js';
import { definePropertyConfigurationFloorPlan } from '../propertyConfigurationFloorPlan.model.js';
import { definePropertyConstructionProgress } from '../propertyConstructionProgress.model.js';
import { definePropertyDocument } from '../propertyDocument.model.js';
import { definePropertyFeature } from '../propertyFeature.model.js';
import { definePropertyMedia } from '../propertyMedia.model.js';
import { definePropertyUpdate } from '../propertyUpdate.model.js';
import { defineStaffMember } from '../staffMember.model.js';
import { defineStaffMemberPermission } from '../staffMemberPermission.model.js';
import { defineStaffPropertyAssignment } from '../staffPropertyAssignment.model.js';
import { defineUser } from '../user.model.js';

// Runs each migration's `up` against a fake queryInterface that records createTable(...) calls, then
// compares every recorded column with the model attribute of the same field: type, length, unsigned,
// precision, ENUM values, nullability and plain defaults. No database is used (the Sequelize instance
// never connects).
const MIGRATIONS = ['20261030212741-create-property-tables.cjs', '20261030212742-create-staff-tables.cjs'];

const MODEL_BY_TABLE = {
  properties: 'Property',
  property_configurations: 'PropertyConfiguration',
  property_configuration_floor_plans: 'PropertyConfigurationFloorPlan',
  property_media: 'PropertyMedia',
  property_documents: 'PropertyDocument',
  property_features: 'PropertyFeature',
  property_construction_progress: 'PropertyConstructionProgress',
  property_updates: 'PropertyUpdate',
  property_amenities: 'PropertyAmenity',
  property_amenity_plans: 'PropertyAmenityPlan',
  staff_members: 'StaffMember',
  staff_member_permissions: 'StaffMemberPermission',
  staff_property_assignments: 'StaffPropertyAssignment',
};

async function recordTables() {
  const tables = {};
  const queryInterface = {
    createTable: async (name, attributes) => {
      tables[name] = attributes;
    },
    addIndex: async () => {},
    addConstraint: async () => {},
    sequelize: { query: async () => {} },
  };
  for (const file of MIGRATIONS) {
    const migration = await import(path.join(process.cwd(), 'src/migrations', file));
    await migration.up(queryInterface, Sequelize);
  }
  return tables;
}

function defineModels() {
  const sequelize = new Sequelize({ dialect: 'mysql', logging: false });
  const models = {
    User: defineUser(sequelize),
    Property: defineProperty(sequelize),
    PropertyConfiguration: definePropertyConfiguration(sequelize),
    PropertyConfigurationFloorPlan: definePropertyConfigurationFloorPlan(sequelize),
    PropertyMedia: definePropertyMedia(sequelize),
    PropertyDocument: definePropertyDocument(sequelize),
    PropertyFeature: definePropertyFeature(sequelize),
    PropertyConstructionProgress: definePropertyConstructionProgress(sequelize),
    PropertyUpdate: definePropertyUpdate(sequelize),
    PropertyAmenity: definePropertyAmenity(sequelize),
    PropertyAmenityPlan: definePropertyAmenityPlan(sequelize),
    StaffMember: defineStaffMember(sequelize),
    StaffMemberPermission: defineStaffMemberPermission(sequelize),
    StaffPropertyAssignment: defineStaffPropertyAssignment(sequelize),
  };
  // User.associate needs the auth models; only the new models are associated here.
  for (const [name, model] of Object.entries(models)) {
    if (name !== 'User') model.associate(models);
  }
  return models;
}

// A comparable description of a column type. The migration writes case-sensitive VARCHARs as raw SQL.
function typeShape(type) {
  if (typeof type === 'string') {
    const match = /^VARCHAR\((\d+)\)/.exec(type);
    if (!match) throw new Error(`unexpected raw type ${type}`);
    return { key: 'STRING', length: Number(match[1]) };
  }
  const shape = { key: type.key };
  if (['STRING', 'CHAR'].includes(type.key)) shape.length = type._length;
  if (['INTEGER', 'SMALLINT', 'TINYINT'].includes(type.key)) shape.unsigned = Boolean(type._unsigned);
  if (type.key === 'DECIMAL') Object.assign(shape, { precision: type._precision, scale: type._scale });
  if (type.key === 'ENUM') shape.values = type.values;
  return shape;
}

const columnShape = (attribute) => ({
  type: typeShape(attribute.type),
  nullable: !(attribute.primaryKey || attribute.allowNull === false),
  // Literal defaults (CURRENT_TIMESTAMP) are set by the DB; Sequelize sets the timestamps itself.
  defaultValue:
    attribute.defaultValue === undefined || typeof attribute.defaultValue === 'object'
      ? undefined
      : attribute.defaultValue,
});

let tables;
let models;

beforeAll(async () => {
  tables = await recordTables();
  models = defineModels();
});

describe('property and staff models match their migrations', () => {
  it('the migrations create exactly the tables that have a model', () => {
    expect(Object.keys(tables).sort()).toEqual(Object.keys(MODEL_BY_TABLE).sort());
  });

  it.each(Object.entries(MODEL_BY_TABLE))('%s -> %s', (table, modelName) => {
    const model = models[modelName];
    expect(model.getTableName()).toBe(table);
    expect(model.options.underscored).toBe(true);

    const byField = Object.fromEntries(
      Object.values(model.rawAttributes).map((attribute) => [attribute.field, attribute]),
    );
    expect(Object.keys(byField).sort()).toEqual(Object.keys(tables[table]).sort());

    for (const [column, attribute] of Object.entries(tables[table])) {
      expect({ column, ...columnShape(byField[column]) }).toEqual({ column, ...columnShape(attribute) });
    }
  });
});

describe('property and staff associations', () => {
  it('a property belongs to its owner, and a user has many properties', () => {
    expect(models.Property.associations.owner).toMatchObject({
      associationType: 'BelongsTo',
      foreignKey: 'ownerId',
      target: models.User,
    });
    expect(models.User.associations.properties).toMatchObject({
      associationType: 'HasMany',
      foreignKey: 'ownerId',
      target: models.Property,
    });
  });

  it.each([
    ['Property', 'configurations', 'HasMany', 'PropertyConfiguration', 'propertyId'],
    ['Property', 'media', 'HasMany', 'PropertyMedia', 'propertyId'],
    ['Property', 'documents', 'HasMany', 'PropertyDocument', 'propertyId'],
    ['Property', 'features', 'HasMany', 'PropertyFeature', 'propertyId'],
    ['Property', 'constructionProgress', 'HasOne', 'PropertyConstructionProgress', 'propertyId'],
    ['Property', 'updates', 'HasMany', 'PropertyUpdate', 'propertyId'],
    ['Property', 'amenities', 'HasMany', 'PropertyAmenity', 'propertyId'],
    [
      'PropertyConfiguration',
      'floorPlans',
      'HasMany',
      'PropertyConfigurationFloorPlan',
      'propertyConfigurationId',
    ],
    ['PropertyAmenity', 'plans', 'HasMany', 'PropertyAmenityPlan', 'propertyAmenityId'],
    ['StaffMember', 'employer', 'BelongsTo', 'User', 'employerId'],
    ['StaffMember', 'user', 'BelongsTo', 'User', 'userId'],
    ['StaffMember', 'permissions', 'HasMany', 'StaffMemberPermission', 'staffMemberId'],
  ])('%s.%s is %s %s by %s', (source, alias, type, target, foreignKey) => {
    expect(models[source].associations[alias]).toMatchObject({
      associationType: type,
      target: models[target],
      foreignKey,
    });
  });

  it('staff members and properties are many-to-many through staff_property_assignments', () => {
    expect(models.StaffMember.associations.assignedProperties).toMatchObject({
      associationType: 'BelongsToMany',
      target: models.Property,
      foreignKey: 'staffMemberId',
      otherKey: 'propertyId',
    });
    expect(models.StaffMember.associations.assignedProperties.through.model).toBe(
      models.StaffPropertyAssignment,
    );
    expect(models.Property.associations.staffMembers).toMatchObject({
      associationType: 'BelongsToMany',
      target: models.StaffMember,
      foreignKey: 'propertyId',
      otherKey: 'staffMemberId',
    });
  });
});
