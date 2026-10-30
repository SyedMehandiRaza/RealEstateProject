import {
  AMENITY_BILLING_CYCLES,
  AMENITY_CATEGORIES,
  AMENITY_PRICING_TYPES,
  AMENITY_STATUSES,
  AREA_UNITS,
  CONFIGURATION_STATUSES,
  LIMITS,
  LISTING_CATEGORIES,
  LISTING_PURPOSES,
  PROPERTY_DOCUMENT_STATUSES,
  PROPERTY_DOCUMENT_TYPES,
  PROPERTY_FILE_MIME_TYPES,
  PROPERTY_MEDIA_MIME_TYPES,
  PROPERTY_MEDIA_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from '@real-estate/shared';
import { readMigration } from '../../test/migrationText.js';

// The property migration repeats the shared enums and limits as literals; these tests keep them equal.
const { text, columnType, enumValues, varcharLength } = readMigration(
  '20261030212741-create-property-tables.cjs',
);
const P = LIMITS.property;

describe('property migration matches shared enums', () => {
  it.each([
    ['properties', 'property_type', PROPERTY_TYPES],
    ['properties', 'listing_purpose', LISTING_PURPOSES],
    ['properties', 'listing_category', LISTING_CATEGORIES],
    ['properties', 'property_status', PROPERTY_STATUSES],
    ['properties', 'total_area_unit', AREA_UNITS],
    ['property_configurations', 'status', CONFIGURATION_STATUSES],
    ['property_configuration_floor_plans', 'mime_type', PROPERTY_FILE_MIME_TYPES],
    ['property_media', 'media_type', PROPERTY_MEDIA_TYPES],
    ['property_media', 'mime_type', PROPERTY_MEDIA_MIME_TYPES],
    ['property_documents', 'document_type', PROPERTY_DOCUMENT_TYPES],
    ['property_documents', 'status', PROPERTY_DOCUMENT_STATUSES],
    ['property_documents', 'mime_type', PROPERTY_FILE_MIME_TYPES],
    ['property_updates', 'mime_type', PROPERTY_FILE_MIME_TYPES],
    ['property_amenities', 'category', AMENITY_CATEGORIES],
    ['property_amenities', 'pricing_type', AMENITY_PRICING_TYPES],
    ['property_amenities', 'status', AMENITY_STATUSES],
    ['property_amenity_plans', 'billing_cycle', AMENITY_BILLING_CYCLES],
  ])('%s.%s', (table, column, values) => {
    expect(enumValues(table, column)).toEqual(values);
  });
});

describe('property migration matches shared limits', () => {
  it.each([
    ['properties', 'name', P.name.max],
    ['properties', 'state', P.state.max],
    ['properties', 'city', P.city.max],
    ['properties', 'locality', P.locality.max],
    ['properties', 'postal_code', P.postalCode.max],
    ['properties', 'address', P.address.max],
    ['properties', 'builder_name', P.builderName.max],
    ['property_configurations', 'name', P.configurationName.max],
    ['property_configuration_floor_plans', 'original_filename', P.fileName.max],
    ['property_media', 'original_filename', P.fileName.max],
    ['property_documents', 'original_filename', P.fileName.max],
    ['property_features', 'name', P.featureName.max],
    ['property_updates', 'title', P.updateTitle.max],
    ['property_updates', 'description', P.updateDescription.max],
    ['property_updates', 'original_filename', P.fileName.max],
    ['property_amenities', 'name', P.amenityName.max],
    ['property_amenities', 'description', P.amenityDescription.max],
    ['property_amenities', 'features', P.amenityFeatures.max],
    ['property_amenity_plans', 'plan_name', P.planName.max],
    ['property_amenity_plans', 'features', P.planFeatures.max],
  ])('%s.%s length', (table, column, max) => {
    expect(varcharLength(table, column)).toBe(max);
  });

  it('stores the long property description as TEXT, which holds the shared maximum', () => {
    expect(columnType('properties', 'description')).toBe('Sequelize.TEXT');
    // TEXT holds 65535 bytes; utf8mb4 needs up to 4 bytes per character.
    expect(P.description.max * 4).toBeLessThanOrEqual(65535);
  });

  it('file size CHECKs use the shared maximums', () => {
    const mb = /const MB = (\d+) \* (\d+);/.exec(text);
    const megabytes = (name) => Number(new RegExp(`const ${name} = (\\d+) \\* MB;`).exec(text)[1]);
    const MB = Number(mb[1]) * Number(mb[2]);
    expect(megabytes('MAX_DOCUMENT_BYTES') * MB).toBe(P.maxFileBytes);
    expect(megabytes('MAX_VIDEO_BYTES') * MB).toBe(P.maxVideoBytes);
  });

  it('postal code CHECK allows the shared length range', () => {
    // First and last character, plus {min-2,max-2} in between.
    expect(text).toContain(`[A-Za-z0-9 -]{${P.postalCode.min - 2},${P.postalCode.max - 2}}`);
  });

  it('year built and progress CHECKs use the shared ranges', () => {
    expect(text).toContain(`\`year_built\` BETWEEN ${P.yearBuilt.min} AND ${P.yearBuilt.max}`);
    for (const column of ['overall', 'foundation', 'structure', 'interior', 'finishing']) {
      expect(text).toContain(`\`${column}_percent\` <= ${P.percent.max}`);
    }
  });
});

describe('property migration deletion rules', () => {
  it('blocks deleting an account that owns properties (PROP-DEC-001)', () => {
    expect(text).toMatch(/'owner_id', 'fk_properties_users', 'users', 'RESTRICT'\)/);
  });
});
