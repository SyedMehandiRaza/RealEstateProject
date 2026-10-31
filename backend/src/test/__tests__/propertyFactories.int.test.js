import {
  createAmenitySchema,
  createConfigurationSchema,
  createUpdateSchema,
  REQUIRED_PROPERTY_DOCUMENT_TYPES,
  updateProgressSchema,
  updatePropertySchema,
} from '@real-estate/shared';
import models from '../../models/index.js';
import { getVerification, logIn } from '../authFlows.js';
import {
  createAmenity,
  createConfiguration,
  createDocument,
  createFloorPlan,
  createMedia,
  createProgress,
  createProperty,
  createUpdate,
  seedDeveloper,
} from '../propertyFactories.js';
import { createTestApp } from '../testApp.js';

// The property factories (PROP-001) build complete properties through the models, so they also prove the
// models and associations match the migrated tables.

jest.setTimeout(30_000); // seeding an Account hashes a password (bcrypt cost 12)

const PROPERTY_TABLES = [
  'PropertyFeature',
  'PropertyConfiguration',
  'PropertyConfigurationFloorPlan',
  'PropertyMedia',
  'PropertyDocument',
  'PropertyConstructionProgress',
  'PropertyUpdate',
  'PropertyAmenity',
  'PropertyAmenityPlan',
];

const countRows = async () =>
  Object.fromEntries(await Promise.all(PROPERTY_TABLES.map(async (m) => [m, await models[m].count()])));

// The body a client would send to edit this property, rebuilt from the stored rows.
function editBodyOf(property) {
  const plain = property.get({ plain: true });
  const { features, constructionProgress } = plain;
  const fields = Object.fromEntries(Object.keys(updatePropertySchema.shape ?? {}).map((k) => [k, plain[k]]));
  return {
    ...fields,
    features: features.map((f) => f.name),
    ...(constructionProgress?.possessionDate ? { possessionDate: constructionProgress.possessionDate } : {}),
  };
}

const loadGraph = (id) =>
  models.Property.findByPk(id, {
    include: [
      { model: models.PropertyFeature, as: 'features' },
      {
        model: models.PropertyConfiguration,
        as: 'configurations',
        include: [{ model: models.PropertyConfigurationFloorPlan, as: 'floorPlans' }],
      },
      { model: models.PropertyMedia, as: 'media' },
      { model: models.PropertyDocument, as: 'documents' },
      { model: models.PropertyConstructionProgress, as: 'constructionProgress' },
      { model: models.PropertyUpdate, as: 'updates' },
      {
        model: models.PropertyAmenity,
        as: 'amenities',
        include: [{ model: models.PropertyAmenityPlan, as: 'plans' }],
      },
    ],
  });

describe('property factories', () => {
  let owner;
  beforeEach(async () => {
    owner = await seedDeveloper();
  });

  it('creates a ready-to-move property with its required children, readable through the models', async () => {
    const created = await createProperty(owner.id);
    const property = await loadGraph(created.id);

    expect(property).toMatchObject({ ownerId: owner.id, propertyStatus: 'ready_to_move' });
    expect(property.features.length).toBeGreaterThanOrEqual(1);
    expect(property.configurations).toHaveLength(1);
    expect(property.media.map((m) => m.mediaType)).toEqual(['image']);
    expect(property.documents.map((d) => d.documentType).sort()).toEqual(
      [...REQUIRED_PROPERTY_DOCUMENT_TYPES].sort(),
    );
    expect(property.documents.every((d) => d.status === 'uploaded')).toBe(true);
    expect(property.constructionProgress).toBeNull();
    expect(updatePropertySchema.safeParse(editBodyOf(property)).error?.issues).toBeUndefined();
  });

  it('creates an under-construction property with progress at 0% and a possession date', async () => {
    const created = await createProperty(owner.id, { status: 'under_construction' });
    const property = await loadGraph(created.id);

    expect(property.constructionProgress).toMatchObject({
      overallPercent: 0,
      foundationPercent: 0,
      structurePercent: 0,
      interiorPercent: 0,
      finishingPercent: 0,
      possessionDate: '2026-12-01',
    });
    expect(updatePropertySchema.safeParse(editBodyOf(property)).error?.issues).toBeUndefined();
  });

  it('creates the counts asked for, with unique names and gallery order by position', async () => {
    const created = await createProperty(owner.id, {
      configurations: 3,
      floorPlans: 2,
      images: 3,
      videos: 1,
      tours: 1,
      updates: 2,
      amenities: 2,
      status: 'under_construction',
    });
    const property = await loadGraph(created.id);

    expect(new Set(property.configurations.map((c) => c.name.toLowerCase())).size).toBe(3);
    expect(property.configurations.every((c) => c.floorPlans.length === 2)).toBe(true);
    const images = property.media.filter((m) => m.mediaType === 'image').map((m) => m.sortOrder);
    expect(images.sort()).toEqual([0, 1, 2]);
    expect(property.media.filter((m) => m.mediaType === 'video')).toHaveLength(1);
    expect(property.media.filter((m) => m.mediaType === 'tour_360')).toHaveLength(1);
    expect(property.updates).toHaveLength(2);
    expect(new Set(property.amenities.map((a) => a.name.toLowerCase())).size).toBe(2);
    const publicIds = [
      ...property.media,
      ...property.documents,
      ...property.configurations.flatMap((c) => c.floorPlans),
    ].map((f) => f.cloudinaryPublicId);
    expect(new Set(publicIds).size).toBe(publicIds.length);
  });

  it('child factories take overrides and default to values the shared schemas accept', async () => {
    const { id } = await createProperty(owner.id, { configurations: 1 });

    const configuration = await createConfiguration(id, { name: 'Penthouse', status: 'inactive' });
    expect(configuration).toMatchObject({ name: 'Penthouse', status: 'inactive' });
    const { name, areaSqft, price, totalUnits, availableUnits } = await createConfiguration(id);
    expect(
      createConfigurationSchema.safeParse({
        name,
        areaSqft: Number(areaSqft),
        price: Number(price),
        totalUnits,
        availableUnits,
      }).success,
    ).toBe(true);

    expect(await createFloorPlan(configuration.id, { mimeType: 'application/pdf' })).toMatchObject({
      cloudinaryResourceType: 'raw',
      mimeType: 'application/pdf',
    });
    expect(await createMedia(id, { mediaType: 'video' })).toMatchObject({
      cloudinaryResourceType: 'video',
      mimeType: 'video/mp4',
    });
    expect(await createDocument(id, { documentType: 'other', status: 'verified' })).toMatchObject({
      documentType: 'other',
      status: 'verified',
    });

    const update = await createUpdate(id);
    expect(update.cloudinaryPublicId).toEqual(expect.any(String));
    expect(
      createUpdateSchema.safeParse({ title: update.title, description: update.description }).success,
    ).toBe(true);
    expect(await createUpdate(id, { image: false })).toMatchObject({
      cloudinaryPublicId: null,
      mimeType: null,
    });

    const amenity = await createAmenity(id, { plans: 2 });
    const amenityBody = {
      name: amenity.name,
      category: amenity.category,
      pricingType: amenity.pricingType,
      description: amenity.description,
      features: amenity.features,
      plans: amenity.plans.map((p) => ({
        planName: p.planName,
        billingCycle: p.billingCycle,
        price: Number(p.price),
        features: p.features,
      })),
    };
    expect(amenity.plans).toHaveLength(2);
    expect(createAmenitySchema.safeParse(amenityBody).success).toBe(true);

    const progress = await createProgress(id, { overallPercent: 40 });
    expect(progress.overallPercent).toBe(40);
    const { overallPercent, foundationPercent, structurePercent, interiorPercent, finishingPercent } =
      progress;
    expect(
      updateProgressSchema.safeParse({
        overallPercent,
        foundationPercent,
        structurePercent,
        interiorPercent,
        finishingPercent,
      }).success,
    ).toBe(true);
  });

  it('deleting a property cascades to every child table (PROP-DEC-002)', async () => {
    const { id } = await createProperty(owner.id, {
      status: 'under_construction',
      floorPlans: 1,
      videos: 1,
      updates: 1,
      amenities: 1,
    });
    const other = await createProperty(owner.id);
    const before = await countRows();
    expect(Object.values(before).every((n) => n > 0)).toBe(true);

    await models.Property.destroy({ where: { id } });

    expect(await models.Property.count()).toBe(1);
    const after = await countRows();
    const otherGraph = await loadGraph(other.id);
    expect(after.PropertyConfiguration).toBe(otherGraph.configurations.length);
    expect(after.PropertyMedia).toBe(otherGraph.media.length);
    expect(after.PropertyDocument).toBe(otherGraph.documents.length);
    expect(after.PropertyFeature).toBe(otherGraph.features.length);
    expect(after.PropertyConstructionProgress).toBe(0);
    expect(after.PropertyUpdate).toBe(0);
    expect(after.PropertyAmenity).toBe(0);
    expect(after.PropertyAmenityPlan).toBe(0);
    expect(after.PropertyConfigurationFloorPlan).toBe(0);
  });
});

describe('seedDeveloper', () => {
  let app;
  beforeEach(() => {
    ({ app } = createTestApp());
  });

  async function statusOf(account) {
    const login = await logIn(app, account);
    expect(login.status).toBe(200);
    return { roles: login.body.data.user.roles, token: login.body.data.accessToken };
  }

  it('seeds an Active Developer by default', async () => {
    const { roles, token } = await statusOf(await seedDeveloper());
    expect(roles).toEqual(['developer']);
    const res = await getVerification(app, token);
    expect(res.body.data.status).toBe('active');
  });

  it('seeds a Developer who is not Active', async () => {
    const { token } = await statusOf(await seedDeveloper('notActive'));
    const res = await getVerification(app, token);
    expect(res.body.data.status).not.toBe('active');
  });

  it('seeds a Buyer', async () => {
    const { roles } = await statusOf(await seedDeveloper('buyer'));
    expect(roles).toEqual(['buyer']);
  });
});
