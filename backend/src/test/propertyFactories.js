import { REQUIRED_PROPERTY_DOCUMENT_TYPES } from '@real-estate/shared';
import {
  createAmenityCases,
  createConfigurationCases,
  createUpdateCases,
  updatePropertyCases,
} from '@real-estate/shared/testing';
import models, { sequelize } from '../models/index.js';
import { seedAccount } from './e2eSeeds.js';

// Test data for the property module (PROP-001), written straight through the models. Defaults are the
// `valid` inputs of the shared parity cases, so every factory row passes the shared schemas. Every
// factory takes overrides of its model attributes. Files are fake public ids; no storage is touched.

let seq = 0;
const next = () => (seq += 1);
const publicId = (kind) => `realestate/test/properties/${kind}-${Date.now()}-${next()}`;

// An Account in the state a property test needs: 'active' Developer (default), 'notActive' Developer
// (documents pending review) or 'buyer'. Returns seedAccount's { id, email, password, roles, ... }.
export function seedDeveloper(state = 'active') {
  if (state === 'buyer') return seedAccount(models, sequelize);
  if (state === 'notActive')
    return seedAccount(models, sequelize, { role: 'developer', documents: 'pending' });
  if (state === 'active') return seedAccount(models, sequelize, { role: 'developer', documents: 'approved' });
  throw new Error(`seedDeveloper: unknown state "${state}"`);
}

const {
  features: defaultFeatures,
  possessionDate: defaultPossessionDate,
  ...propertyDefaults
} = updatePropertyCases.valid;

const FILES = {
  image: { cloudinaryResourceType: 'image', mimeType: 'image/jpeg', ext: 'jpg' },
  video: { cloudinaryResourceType: 'video', mimeType: 'video/mp4', ext: 'mp4' },
  pdf: { cloudinaryResourceType: 'raw', mimeType: 'application/pdf', ext: 'pdf' },
  png: { cloudinaryResourceType: 'image', mimeType: 'image/png', ext: 'png' },
};
const FILE_BY_MIME = {
  'image/jpeg': FILES.image,
  'image/png': FILES.png,
  'video/mp4': FILES.video,
  'application/pdf': FILES.pdf,
};

// The file columns shared by every property file table, for `kind` (used in the public id and file name).
function fileColumns(kind, mimeType) {
  const file = FILE_BY_MIME[mimeType];
  return {
    cloudinaryPublicId: publicId(kind),
    cloudinaryResourceType: file.cloudinaryResourceType,
    originalFilename: `${kind}-${seq}.${file.ext}`,
    mimeType,
    sizeBytes: 2048,
  };
}

export function createConfiguration(propertyId, overrides = {}) {
  const { name, ...rest } = createConfigurationCases.valid;
  return models.PropertyConfiguration.create({
    propertyId,
    ...rest,
    name: `${name} ${next()}`,
    ...overrides,
  });
}

export function createFloorPlan(propertyConfigurationId, { mimeType = 'image/png', ...overrides } = {}) {
  return models.PropertyConfigurationFloorPlan.create({
    propertyConfigurationId,
    ...fileColumns('floor-plan', mimeType),
    ...overrides,
  });
}

const MEDIA_MIME = { image: 'image/jpeg', video: 'video/mp4', tour_360: 'video/mp4' };

export function createMedia(
  propertyId,
  { mediaType = 'image', mimeType = MEDIA_MIME[mediaType], ...overrides } = {},
) {
  return models.PropertyMedia.create({
    propertyId,
    mediaType,
    sortOrder: 0,
    ...fileColumns(mediaType, mimeType),
    ...overrides,
  });
}

export function createDocument(
  propertyId,
  { documentType = 'rera_certificate', mimeType = 'application/pdf', ...overrides } = {},
) {
  return models.PropertyDocument.create({
    propertyId,
    documentType,
    status: 'uploaded',
    ...fileColumns(documentType, mimeType),
    ...overrides,
  });
}

// `image: false` creates an update without an image.
export function createUpdate(propertyId, { image = true, ...overrides } = {}) {
  const imageColumns = image
    ? fileColumns('update', 'image/jpeg')
    : {
        cloudinaryPublicId: null,
        cloudinaryResourceType: null,
        originalFilename: null,
        mimeType: null,
        sizeBytes: null,
      };
  return models.PropertyUpdate.create({
    propertyId,
    ...createUpdateCases.valid,
    ...imageColumns,
    ...overrides,
  });
}

// `plans` is how many plans to create (default 1). Returns the amenity with its `plans` loaded.
export async function createAmenity(propertyId, { plans = 1, ...overrides } = {}) {
  const {
    plans: [plan],
    name,
    ...rest
  } = createAmenityCases.valid;
  const amenity = await models.PropertyAmenity.create({
    propertyId,
    ...rest,
    name: `${name} ${next()}`,
    ...overrides,
  });
  await models.PropertyAmenityPlan.bulkCreate(
    Array.from({ length: plans }, (_, i) => ({
      ...plan,
      planName: `${plan.planName} ${i + 1}`,
      propertyAmenityId: amenity.id,
    })),
  );
  return amenity.reload({ include: [{ model: models.PropertyAmenityPlan, as: 'plans' }] });
}

export function createProgress(propertyId, overrides = {}) {
  return models.PropertyConstructionProgress.create({
    propertyId,
    overallPercent: 0,
    foundationPercent: 0,
    structurePercent: 0,
    interiorPercent: 0,
    finishingPercent: 0,
    possessionDate: defaultPossessionDate,
    ...overrides,
  });
}

// A complete property for `ownerId`. Options (counts are per property, floorPlans per configuration):
// status ('ready_to_move' default | 'under_construction': adds progress at 0% with a possession date),
// features (names), configurations 1, floorPlans 0, images 1, videos 0, tours 0, documents (types, the 4
// required by default), updates 0, amenities 0, and `overrides` of the property's own columns.
export async function createProperty(
  ownerId,
  {
    status = 'ready_to_move',
    features = defaultFeatures,
    configurations = 1,
    floorPlans = 0,
    images = 1,
    videos = 0,
    tours = 0,
    documents = REQUIRED_PROPERTY_DOCUMENT_TYPES,
    updates = 0,
    amenities = 0,
    overrides = {},
  } = {},
) {
  const property = await models.Property.create({
    ...propertyDefaults,
    ownerId,
    name: `${propertyDefaults.name} ${next()}`,
    propertyStatus: status,
    ...overrides,
  });
  const id = property.id;
  await models.PropertyFeature.bulkCreate(features.map((name) => ({ propertyId: id, name })));
  for (let i = 0; i < configurations; i += 1) {
    const configuration = await createConfiguration(id);
    for (let j = 0; j < floorPlans; j += 1) await createFloorPlan(configuration.id);
  }
  const gallery = { image: images, video: videos, tour_360: tours };
  for (const [mediaType, count] of Object.entries(gallery)) {
    for (let sortOrder = 0; sortOrder < count; sortOrder += 1)
      await createMedia(id, { mediaType, sortOrder });
  }
  for (const documentType of documents) await createDocument(id, { documentType });
  if (status === 'under_construction') await createProgress(id);
  for (let i = 0; i < updates; i += 1) await createUpdate(id);
  for (let i = 0; i < amenities; i += 1) await createAmenity(id);
  return property.reload();
}
