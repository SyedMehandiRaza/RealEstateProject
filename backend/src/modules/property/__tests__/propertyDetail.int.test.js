import request from 'supertest';
import { commonMessages } from '@real-estate/shared';
import models from '../../../models/index.js';
import {
  createConfiguration,
  createMedia,
  createProperty,
  developerSession,
} from '../../../test/propertyFactories.js';
import { createTestApp } from '../../../test/testApp.js';

// GET /api/properties/:id (PROP-010, PROP-DEC-022): the Overview header's data.

jest.setTimeout(120_000); // sessions hash passwords

describe('GET /api/properties/:id', () => {
  let app;
  let clock;
  let session;
  beforeEach(async () => {
    ({ app, clock } = createTestApp());
    session = await developerSession(app);
  });

  const get = (id, token = session.token) =>
    request(app).get(`/api/properties/${id}`).set('Authorization', `Bearer ${token}`);

  it('returns the detail with signed file URLs and no public id', async () => {
    const property = await createProperty(session.account.id, { images: 0, configurations: 0 });
    await createMedia(property.id, { sortOrder: 1, originalFilename: 'later.jpg' });
    await createMedia(property.id, { sortOrder: 0, originalFilename: 'cover.jpg' });
    await createConfiguration(property.id, { name: '2 BHK', price: 800000 });
    await createConfiguration(property.id, { name: '3 BHK', price: 1200000 });
    await createConfiguration(property.id, { name: 'Shop', price: 5, status: 'inactive' });

    const res = await get(property.id);

    expect(res.status).toBe(200);
    expect(res.body.data.property).toMatchObject({
      id: property.id,
      name: property.name,
      propertyStatus: 'ready_to_move',
      latitude: Number(property.latitude),
      features: (
        await models.PropertyFeature.findAll({ where: { propertyId: property.id }, order: [['id', 'ASC']] })
      ).map((f) => f.name),
      possessionDate: null,
      configurationNames: ['2 BHK', '3 BHK', 'Shop'],
      priceRange: { min: 800000, max: 1200000 },
      coverImage: expect.objectContaining({
        fileName: 'cover.jpg',
        url: expect.stringContaining('https://files.test/image/'),
        urlExpiresAt: new Date(clock.now().getTime() + 60 * 60_000).toISOString(),
      }),
      progress: null,
    });
    expect(JSON.stringify(res.body)).not.toMatch(/publicId|cloudinary/i);
  });

  it('includes progress with badges only for an under-construction property', async () => {
    const property = await createProperty(session.account.id, { status: 'under_construction' });
    await models.PropertyConstructionProgress.update(
      { overallPercent: 55, foundationPercent: 100, structurePercent: 60 },
      { where: { propertyId: property.id } },
    );

    const res = await get(property.id);

    expect(res.body.data.property.possessionDate).toBe('2026-12-01');
    expect(res.body.data.property.progress).toMatchObject({
      overallPercent: 55,
      phases: [
        { phase: 'foundation', percent: 100, badge: 'complete' },
        { phase: 'structure', percent: 60, badge: 'in_progress' },
        { phase: 'interior', percent: 0, badge: null },
        { phase: 'finishing', percent: 0, badge: null },
      ],
    });

    // Back to ready to move: the progress row stays but is hidden (PROP-DEC-015).
    await models.Property.update({ propertyStatus: 'ready_to_move' }, { where: { id: property.id } });
    const after = await get(property.id);
    expect(after.body.data.property).toMatchObject({ progress: null, possessionDate: null });
  });

  it("answers another Developer's property and a missing id with 404", async () => {
    const other = await developerSession(app);
    const property = await createProperty(other.account.id);
    for (const id of [property.id, property.id + 1000]) {
      const res = await get(id);
      expect({ status: res.status, code: res.body.error.code }).toEqual({ status: 404, code: 'NOT_FOUND' });
    }
  });

  it('refuses an invalid id with 422', async () => {
    const res = await get('abc');
    expect(res.status).toBe(422);
    expect(res.body.error.fields.id).toEqual([commonMessages.id.invalid]);
  });

  it.each([
    ['without a token', null, 401, 'UNAUTHORIZED'],
    ['as a Buyer', 'buyer', 403, 'FORBIDDEN'],
    ['as a Developer who is not Active', 'notActive', 403, 'DEVELOPER_NOT_ACTIVE'],
  ])('refuses a request %s', async (_name, state, status, code) => {
    const property = await createProperty(session.account.id);
    let req = request(app).get(`/api/properties/${property.id}`);
    if (state) req = req.set('Authorization', `Bearer ${(await developerSession(app, state)).token}`);
    const res = await req;
    expect({ status: res.status, code: res.body.error.code }).toEqual({ status, code });
  });
});
