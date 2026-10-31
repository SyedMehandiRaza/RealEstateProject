import request from 'supertest';
import { commonMessages, propertyMessages as m } from '@real-estate/shared';
import models from '../../../models/index.js';
import {
  createConfiguration,
  createMedia,
  createProperty,
  developerSession,
} from '../../../test/propertyFactories.js';
import { createTestApp } from '../../../test/testApp.js';

// GET /api/properties (PROP-009, PROP-DEC-014): the caller's properties as cards, newest first, paged.

jest.setTimeout(120_000); // sessions hash passwords

const PROPERTIES = '/api/properties';

describe('GET /api/properties', () => {
  let app;
  let clock;
  let session;
  beforeEach(async () => {
    ({ app, clock } = createTestApp());
    session = await developerSession(app);
  });

  const list = (query = {}, token = session.token) =>
    request(app).get(PROPERTIES).query(query).set('Authorization', `Bearer ${token}`);
  const named = (name, options = {}) =>
    createProperty(session.account.id, { ...options, overrides: { name, ...options.overrides } });

  it("lists only the caller's properties, newest first, with paging meta", async () => {
    const other = await developerSession(app);
    await createProperty(other.account.id, { overrides: { name: 'Not mine' } });
    await named('Oldest');
    await named('Middle');
    await named('Newest');

    const res = await list();

    expect(res.status).toBe(200);
    expect(res.body.data.properties.map((p) => p.name)).toEqual(['Newest', 'Middle', 'Oldest']);
    expect(res.body.meta).toEqual({ page: 1, pageSize: 12, total: 3 });
  });

  it('pages by 12 by default and accepts a page size up to 50', async () => {
    for (let i = 1; i <= 13; i += 1) await named(`Tower ${String(i).padStart(2, '0')}`);

    const second = await list({ page: 2 });
    expect(second.body.data.properties.map((p) => p.name)).toEqual(['Tower 01']);
    expect(second.body.meta).toEqual({ page: 2, pageSize: 12, total: 13 });

    const big = await list({ pageSize: 50 });
    expect(big.body.data.properties).toHaveLength(13);
    expect(big.body.meta.pageSize).toBe(50);
  });

  it('searches names that contain the text, ignoring case', async () => {
    await named('Sky Heights');
    await named('Ocean View');
    await named('Skyline Towers');

    const res = await list({ search: '  sky ' });
    expect(res.body.data.properties.map((p) => p.name).sort()).toEqual(['Sky Heights', 'Skyline Towers']);
    expect(res.body.meta.total).toBe(2);
  });

  it.each([
    ['%', '100% Green'],
    ['_', 'Block_A'],
    ['\\', 'Back\\Slash'],
  ])('matches %s literally', async (search, match) => {
    for (const name of ['100% Green', 'Block_A', 'Back\\Slash', 'Plain Name']) await named(name);
    const res = await list({ search });
    expect(res.body.data.properties.map((p) => p.name)).toEqual([match]);
  });

  it('builds the card: cover, Active price range, units and progress only under construction', async () => {
    const built = await named('Built', { images: 0, configurations: 0 });
    await createMedia(built.id, { sortOrder: 2, originalFilename: 'second.jpg' });
    await createMedia(built.id, { sortOrder: 1, originalFilename: 'cover.jpg' });
    await createMedia(built.id, { mediaType: 'video', sortOrder: 0 });
    await createConfiguration(built.id, { price: 900000, status: 'active' });
    await createConfiguration(built.id, { price: 1500000, status: 'active' });
    await createConfiguration(built.id, { price: 10, status: 'inactive' });

    const building = await named('Building', { status: 'under_construction', images: 0, configurations: 0 });
    await models.PropertyConstructionProgress.update(
      { overallPercent: 40 },
      { where: { propertyId: building.id } },
    );
    await createConfiguration(building.id, { status: 'inactive' });

    const res = await list();
    const [buildingCard, builtCard] = res.body.data.properties;

    expect(builtCard).toEqual({
      id: built.id,
      name: 'Built',
      propertyType: built.propertyType,
      listingPurpose: built.listingPurpose,
      propertyStatus: 'ready_to_move',
      locality: built.locality,
      city: built.city,
      startingPrice: Number(built.startingPrice),
      priceRange: { min: 900000, max: 1500000 },
      totalUnits: built.totalUnits,
      coverImage: expect.objectContaining({
        fileName: 'cover.jpg',
        url: expect.stringContaining('https://files.test/image/'),
        urlExpiresAt: new Date(clock.now().getTime() + 60 * 60_000).toISOString(),
      }),
      progressPercent: null,
      createdAt: expect.any(String),
    });
    expect(buildingCard).toMatchObject({
      name: 'Building',
      coverImage: null,
      priceRange: null,
      progressPercent: 40,
    });
    expect(JSON.stringify(res.body)).not.toMatch(/publicId|cloudinary/i);
  });

  it('shows an empty page with total 0 when the caller has no property', async () => {
    const res = await list();
    expect(res.body).toEqual({
      success: true,
      data: { properties: [] },
      meta: { page: 1, pageSize: 12, total: 0 },
    });
  });

  it.each([
    ['pageSize over 50', { pageSize: 51 }, 'pageSize', m.query.pageSize.invalid],
    ['pageSize 0', { pageSize: 0 }, 'pageSize', m.query.pageSize.invalid],
    ['page 0', { page: 0 }, 'page', commonMessages.page.invalid],
    ['page not a number', { page: 'two' }, 'page', commonMessages.page.invalid],
    ['search over 100 characters', { search: 'a'.repeat(101) }, 'search', m.query.search.max],
  ])('refuses %s with 422', async (_name, query, field, message) => {
    const res = await list(query);
    expect(res.status).toBe(422);
    expect(res.body.error.fields[field]).toEqual([message]);
  });

  it.each([
    ['without a token', null, 401, 'UNAUTHORIZED'],
    ['as a Buyer', 'buyer', 403, 'FORBIDDEN'],
    ['as a Developer who is not Active', 'notActive', 403, 'DEVELOPER_NOT_ACTIVE'],
  ])('refuses a request %s', async (_name, state, status, code) => {
    let req = request(app).get(PROPERTIES);
    if (state) req = req.set('Authorization', `Bearer ${(await developerSession(app, state)).token}`);
    const res = await req;
    expect({ status: res.status, code: res.body.error.code }).toEqual({ status, code });
  });
});
