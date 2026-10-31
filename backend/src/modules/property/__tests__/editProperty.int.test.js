import request from 'supertest';
import { updatePropertyCases } from '@real-estate/shared/testing';
import models from '../../../models/index.js';
import { createProperty, developerSession } from '../../../test/propertyFactories.js';
import { createTestApp } from '../../../test/testApp.js';

// PUT /api/properties/:id (PROP-011, PROP-DEC-015): Edit Property saves the step 1-2 fields and the status.

jest.setTimeout(120_000); // sessions hash passwords

const valid = updatePropertyCases.valid; // under construction, with a possession date
const readyToMove = { ...valid, propertyStatus: 'ready_to_move', possessionDate: undefined };

const featuresOf = async (propertyId) =>
  (await models.PropertyFeature.findAll({ where: { propertyId }, order: [['name', 'ASC']] })).map(
    (f) => f.name,
  );

describe('PUT /api/properties/:id', () => {
  let app;
  let session;
  let property;
  beforeEach(async () => {
    ({ app } = createTestApp());
    session = await developerSession(app);
    property = await createProperty(session.account.id, { features: ['Gym', 'Old Feature'] });
  });

  const put = (body, id = property.id, token = session.token) =>
    request(app).put(`/api/properties/${id}`).set('Authorization', `Bearer ${token}`).send(body);

  it('saves the fields, replaces the features and answers with the detail', async () => {
    const res = await put({ ...readyToMove, name: 'Sky Heights Phase 2', features: ['Gym', 'Clubhouse'] });

    expect(res.status).toBe(200);
    expect(res.body.data.property).toMatchObject({
      id: property.id,
      name: 'Sky Heights Phase 2',
      propertyStatus: 'ready_to_move',
      features: ['Gym', 'Clubhouse'],
      progress: null,
    });
    expect(await models.Property.findByPk(property.id)).toMatchObject({ name: 'Sky Heights Phase 2' });
    expect(await featuresOf(property.id)).toEqual(['Clubhouse', 'Gym']);
  });

  it('creates progress at 0% with the possession date when the status becomes under construction', async () => {
    const res = await put(valid);

    expect(res.status).toBe(200);
    expect(res.body.data.property).toMatchObject({
      propertyStatus: 'under_construction',
      possessionDate: valid.possessionDate,
      progress: { overallPercent: 0, possessionDate: valid.possessionDate },
    });
    expect(await models.PropertyConstructionProgress.count({ where: { propertyId: property.id } })).toBe(1);
  });

  it('keeps progress and updates when the status goes back to ready to move, and shows them again later', async () => {
    await put(valid);
    await models.PropertyConstructionProgress.update(
      { overallPercent: 60 },
      { where: { propertyId: property.id } },
    );
    await models.PropertyUpdate.create({ propertyId: property.id, title: 'Slab', description: 'Cast' });

    expect((await put(readyToMove)).body.data.property).toMatchObject({
      progress: null,
      possessionDate: null,
    });
    expect(await models.PropertyConstructionProgress.count()).toBe(1);
    expect(await models.PropertyUpdate.count()).toBe(1);

    const again = await put({ ...valid, possessionDate: '2027-06-30' });
    expect(again.body.data.property.progress).toMatchObject({
      overallPercent: 60,
      possessionDate: '2027-06-30',
    });
    expect(await models.PropertyConstructionProgress.count()).toBe(1);
  });

  it('clears the possession date when an under-construction property is saved without one', async () => {
    await put(valid);
    const res = await put({ ...valid, possessionDate: undefined });
    expect(res.body.data.property).toMatchObject({
      possessionDate: null,
      progress: { possessionDate: null },
    });
  });

  it.each(updatePropertyCases.invalid.map((c) => [c.name, c]))(
    'validation parity: %s',
    async (_name, { input, field, message }) => {
      const res = await put({ ...valid, ...input });
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields[field]).toContain(message);
    },
  );

  it('leaves the old values when a step fails part way', async () => {
    jest.spyOn(models.PropertyFeature, 'bulkCreate').mockRejectedValueOnce(new Error('disk full'));

    const res = await put({ ...valid, name: 'Renamed', features: ['Pool'] });

    expect(res.status).toBe(500);
    expect((await models.Property.findByPk(property.id)).name).toBe(property.name);
    expect(await featuresOf(property.id)).toEqual(['Gym', 'Old Feature']);
    expect(await models.PropertyConstructionProgress.count()).toBe(0);
    jest.restoreAllMocks();
  });

  it("answers another Developer's property and a missing id with 404, changing nothing", async () => {
    const other = await developerSession(app);
    for (const id of [property.id, property.id + 1000]) {
      const res = await put(valid, id, other.token);
      expect({ status: res.status, code: res.body.error.code }).toEqual({ status: 404, code: 'NOT_FOUND' });
    }
    expect((await models.Property.findByPk(property.id)).propertyStatus).toBe('ready_to_move');
  });

  it.each([
    ['without a token', null, 401, 'UNAUTHORIZED'],
    ['as a Buyer', 'buyer', 403, 'FORBIDDEN'],
    ['as a Developer who is not Active', 'notActive', 403, 'DEVELOPER_NOT_ACTIVE'],
  ])('refuses a request %s', async (_name, state, status, code) => {
    let req = request(app).put(`/api/properties/${property.id}`);
    if (state) req = req.set('Authorization', `Bearer ${(await developerSession(app, state)).token}`);
    const res = await req.send(valid);
    expect({ status: res.status, code: res.body.error.code }).toEqual({ status, code });
  });
});
