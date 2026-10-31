import request from 'supertest';
import models from '../../../models/index.js';
import {
  createConfiguration,
  createFloorPlan,
  createProperty,
  createUpdate,
  developerSession,
} from '../../../test/propertyFactories.js';
import { createTestApp } from '../../../test/testApp.js';

// DELETE /api/properties/:id (PROP-012, PROP-DEC-002, PROP-DEC-016, DEC-018): the property and everything
// under it go; every Cloudinary file it owned is queued for the deletion worker in the same transaction.

jest.setTimeout(120_000); // sessions hash passwords

const CHILD_MODELS = [
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

describe('DELETE /api/properties/:id', () => {
  let app;
  let storage;
  let session;
  let property;
  beforeEach(async () => {
    ({ app, storage } = createTestApp());
    session = await developerSession(app);
    property = await createProperty(session.account.id, {
      status: 'under_construction',
      floorPlans: 1,
      images: 2,
      videos: 1,
      tours: 1,
      updates: 0,
      amenities: 1,
    });
  });

  const del = (id = property.id, token = session.token) =>
    request(app).delete(`/api/properties/${id}`).set('Authorization', `Bearer ${token}`);

  async function filesOf(propertyId) {
    const configurations = await models.PropertyConfiguration.findAll({ where: { propertyId } });
    const rows = [
      ...(await models.PropertyConfigurationFloorPlan.findAll({
        where: { propertyConfigurationId: configurations.map((c) => c.id) },
      })),
      ...(await models.PropertyMedia.findAll({ where: { propertyId } })),
      ...(await models.PropertyDocument.findAll({ where: { propertyId } })),
      ...(await models.PropertyUpdate.findAll({ where: { propertyId } })).filter((u) => u.cloudinaryPublicId),
    ];
    return rows.map((row) => ({
      publicId: row.cloudinaryPublicId,
      resourceType: row.cloudinaryResourceType,
    }));
  }

  it('deletes the property and its rows, queues every file and answers 204 with no body', async () => {
    const configuration = await createConfiguration(property.id);
    await createFloorPlan(configuration.id, { mimeType: 'application/pdf' });
    await createUpdate(property.id);
    await createUpdate(property.id, { image: false });
    const files = await filesOf(property.id);

    const res = await del();

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(await models.Property.findByPk(property.id)).toBeNull();
    for (const model of CHILD_MODELS)
      expect({ model, rows: await models[model].count() }).toEqual({ model, rows: 0 });

    const queued = await models.PendingFileDeletion.findAll({ raw: true });
    expect(queued.map(({ publicId, resourceType }) => ({ publicId, resourceType })).sort(byId)).toEqual(
      files.sort(byId),
    );
    expect(new Set(queued.map((row) => row.reason))).toEqual(new Set(['record_deleted']));
    expect(new Set(files.map((f) => f.resourceType))).toEqual(new Set(['image', 'raw', 'video']));
    expect(storage.calls.filter(([call]) => call === 'destroy')).toEqual([]); // the worker deletes later
  });

  it("leaves the owner's other properties and their files alone", async () => {
    const other = await createProperty(session.account.id, { images: 1 });
    expect((await del()).status).toBe(204);

    expect(await models.Property.findByPk(other.id)).not.toBeNull();
    expect(await models.PropertyMedia.count({ where: { propertyId: other.id } })).toBe(1);
    const otherFiles = (await filesOf(other.id)).map((file) => file.publicId);
    const queued = (await models.PendingFileDeletion.findAll()).map((row) => row.publicId);
    expect(queued.filter((publicId) => otherFiles.includes(publicId))).toEqual([]);
  });

  it('keeps everything when a step fails part way', async () => {
    jest.spyOn(models.Property, 'destroy').mockRejectedValueOnce(new Error('lock wait timeout'));

    const res = await del();

    expect(res.status).toBe(500);
    expect(await models.Property.findByPk(property.id)).not.toBeNull();
    expect(await models.PendingFileDeletion.count()).toBe(0);
    jest.restoreAllMocks();
  });

  it("answers another Developer's property and a missing id with 404, deleting nothing", async () => {
    const other = await developerSession(app);
    for (const id of [property.id, property.id + 1000]) {
      const res = await del(id, other.token);
      expect({ status: res.status, code: res.body.error.code }).toEqual({ status: 404, code: 'NOT_FOUND' });
    }
    expect(await models.Property.findByPk(property.id)).not.toBeNull();
    expect(await models.PendingFileDeletion.count()).toBe(0);
  });

  it.each([
    ['without a token', null, 401, 'UNAUTHORIZED'],
    ['as a Buyer', 'buyer', 403, 'FORBIDDEN'],
    ['as a Developer who is not Active', 'notActive', 403, 'DEVELOPER_NOT_ACTIVE'],
  ])('refuses a request %s', async (_name, state, status, code) => {
    let req = request(app).delete(`/api/properties/${property.id}`);
    if (state) req = req.set('Authorization', `Bearer ${(await developerSession(app, state)).token}`);
    const res = await req;
    expect({ status: res.status, code: res.body.error.code }).toEqual({ status, code });
    expect(await models.Property.findByPk(property.id)).not.toBeNull();
  });
});

const byId = (a, b) => a.publicId.localeCompare(b.publicId);
