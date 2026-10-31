import request from 'supertest';
import { propertyMessages as m } from '@real-estate/shared';
import { createPropertyCases } from '@real-estate/shared/testing';
import models from '../../../models/index.js';
import { developerSession } from '../../../test/propertyFactories.js';
import { createBody, stageToken } from '../../../test/propertyUploads.js';
import { createTestApp } from '../../../test/testApp.js';
import { UPLOAD_TOKEN_TTL_MS } from '../uploadToken.js';

// POST /api/properties (PROP-008): Add Property Submit creates the whole property in one transaction.

jest.setTimeout(120_000); // sessions hash passwords; each body stages about ten files

const PROPERTIES = '/api/properties';
const valid = createPropertyCases.valid; // under construction, with a possession date

const submit = (app, token, body) =>
  request(app).post(PROPERTIES).set('Authorization', `Bearer ${token}`).send(body);

// JSON drops undefined, so the possession date is not sent.
const readyToMove = { ...valid, propertyStatus: 'ready_to_move', possessionDate: undefined };

describe('POST /api/properties', () => {
  let app;
  let storage;
  let clock;
  let session;
  beforeEach(async () => {
    ({ app, storage, clock } = createTestApp());
    session = await developerSession(app);
  });

  it('creates the property with every child row and answers 201 with the detail', async () => {
    const body = await createBody(app, session.token, valid, {
      images: 2,
      videos: 1,
      tours: 1,
      floorPlans: 2,
    });
    const res = await submit(app, session.token, body);

    expect(res.status).toBe(201);
    const { property } = res.body.data;
    expect(property).toMatchObject({
      id: expect.any(Number),
      name: valid.name,
      propertyType: valid.propertyType,
      propertyStatus: 'under_construction',
      countryCode: 'IN',
      latitude: valid.latitude,
      longitude: valid.longitude,
      totalArea: valid.totalArea,
      startingPrice: valid.startingPrice,
      features: valid.features,
      possessionDate: valid.possessionDate,
      configurationNames: [valid.configurations[0].name],
      priceRange: { min: valid.configurations[0].price, max: valid.configurations[0].price },
      coverImage: {
        id: expect.any(Number),
        fileName: 'photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 2048,
        url: expect.stringContaining('https://files.test/image/'),
        urlExpiresAt: new Date(clock.now().getTime() + 60 * 60_000).toISOString(),
      },
      progress: {
        overallPercent: 0,
        foundationPercent: 0,
        structurePercent: 0,
        interiorPercent: 0,
        finishingPercent: 0,
        possessionDate: valid.possessionDate,
        phases: [
          { phase: 'foundation', percent: 0, badge: null },
          { phase: 'structure', percent: 0, badge: null },
          { phase: 'interior', percent: 0, badge: null },
          { phase: 'finishing', percent: 0, badge: null },
        ],
      },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(JSON.stringify(res.body)).not.toMatch(/publicId|cloudinary/i);

    const id = property.id;
    expect(await models.Property.findByPk(id)).toMatchObject({ ownerId: session.account.id });
    const configurations = await models.PropertyConfiguration.findAll({
      where: { propertyId: id },
      include: [{ model: models.PropertyConfigurationFloorPlan, as: 'floorPlans' }],
    });
    expect(configurations).toHaveLength(1);
    expect(configurations[0].floorPlans).toHaveLength(2);
    const media = await models.PropertyMedia.findAll({ where: { propertyId: id }, order: [['id', 'ASC']] });
    expect(media.map((row) => [row.mediaType, row.sortOrder])).toEqual([
      ['image', 0],
      ['image', 1],
      ['video', 0],
      ['tour_360', 0],
    ]);
    expect(media[0].cloudinaryPublicId).toBe(storage.calls.filter(([c]) => c === 'upload')[2][1]);
    const documents = await models.PropertyDocument.findAll({ where: { propertyId: id } });
    expect(documents.map((d) => d.documentType).sort()).toEqual(
      ['floor_plan', 'legal_noc', 'other', 'ownership_proof', 'rera_certificate'].sort(),
    );
    expect(documents.every((d) => d.status === 'uploaded' && d.cloudinaryResourceType === 'raw')).toBe(true);
    expect(await models.PropertyFeature.count({ where: { propertyId: id } })).toBe(valid.features.length);
  });

  it('creates progress at 0% only for an under-construction property', async () => {
    const res = await submit(
      app,
      session.token,
      await createBody(app, session.token, readyToMove, { other: false }),
    );

    expect(res.status).toBe(201);
    expect(res.body.data.property).toMatchObject({
      propertyStatus: 'ready_to_move',
      progress: null,
      possessionDate: null,
    });
    expect(await models.PropertyConstructionProgress.count()).toBe(0);
    expect(await models.PropertyDocument.count()).toBe(4);
  });

  it.each(createPropertyCases.invalid.map((c) => [c.name, c]))(
    'validation parity: %s',
    async (_name, { input, field, message }) => {
      const res = await submit(app, session.token, { ...valid, ...input });
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields[field]).toContain(message);
    },
  );

  describe('upload tokens', () => {
    let body;
    beforeEach(async () => {
      body = await createBody(app, session.token, valid, {
        images: 1,
        videos: 0,
        tours: 0,
        floorPlans: 1,
        other: false,
      });
    });

    const expectInvalidAt = async (sent, path) => {
      const res = await submit(app, session.token, sent);
      expect(res.status).toBe(422);
      expect(res.body.error.fields).toEqual({ [path]: [m.uploadToken.invalid] });
      expect(await models.Property.count()).toBe(0);
    };

    it('refuses an expired token at its path', async () => {
      clock.advance(UPLOAD_TOKEN_TTL_MS);
      const res = await submit(app, session.token, body);
      expect(res.status).toBe(422);
      expect(res.body.error.fields['media.images.0']).toEqual([m.uploadToken.invalid]);
      expect(res.body.error.fields['documents.reraCertificate']).toEqual([m.uploadToken.invalid]);
      expect(await models.Property.count()).toBe(0);
    });

    it('refuses a tampered token', async () => {
      const [image] = body.media.images;
      const tampered = `${image.slice(0, -2)}${image.endsWith('AA') ? 'BB' : 'AA'}`;
      await expectInvalidAt({ ...body, media: { ...body.media, images: [tampered] } }, 'media.images.0');
    });

    it("refuses another Developer's token", async () => {
      const other = await developerSession(app);
      const foreign = await stageToken(app, other.token, 'image');
      await expectInvalidAt({ ...body, media: { ...body.media, images: [foreign] } }, 'media.images.0');
    });

    it('refuses a token staged for another purpose', async () => {
      const image = await stageToken(app, session.token, 'image');
      await expectInvalidAt(
        { ...body, documents: { ...body.documents, legalNoc: image } },
        'documents.legalNoc',
      );
    });

    it('refuses a token whose file is already stored with 409 at its path', async () => {
      expect((await submit(app, session.token, body)).status).toBe(201);
      const again = await submit(app, session.token, { ...body, name: 'Sky Heights 2' });

      expect(again.status).toBe(409);
      expect(again.body.error.code).toBe('CONFLICT');
      expect(again.body.error.fields['media.images.0']).toEqual([m.uploadToken.invalid]);
      expect(again.body.error.fields['configurations.0.floorPlans.0']).toEqual([m.uploadToken.invalid]);
      expect(await models.Property.count()).toBe(1);
    });
  });

  it('leaves no row when a step fails part way', async () => {
    const body = await createBody(app, session.token, valid, { images: 1, videos: 0, tours: 0 });
    jest.spyOn(models.PropertyDocument, 'bulkCreate').mockRejectedValueOnce(new Error('disk full'));

    const res = await submit(app, session.token, body);

    expect(res.status).toBe(500);
    for (const model of [
      'Property',
      'PropertyFeature',
      'PropertyConfiguration',
      'PropertyConfigurationFloorPlan',
      'PropertyMedia',
      'PropertyConstructionProgress',
    ]) {
      expect(await models[model].count()).toBe(0);
    }
    jest.restoreAllMocks();
  });

  it.each([
    ['without a token', null, 401, 'UNAUTHORIZED'],
    ['as a Buyer', 'buyer', 403, 'FORBIDDEN'],
    ['as a Developer who is not Active', 'notActive', 403, 'DEVELOPER_NOT_ACTIVE'],
  ])('refuses a request %s', async (_name, state, status, code) => {
    let req = request(app).post(PROPERTIES);
    if (state) req = req.set('Authorization', `Bearer ${(await developerSession(app, state)).token}`);
    const res = await req.send(valid);
    expect({ status: res.status, code: res.body.error.code }).toEqual({ status, code });
  });
});
