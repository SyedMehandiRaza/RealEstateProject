import express from 'express';
import request from 'supertest';
import { commonMessages, ERROR_CODES } from '@real-estate/shared';
import { errorHandler } from '../../../middlewares/errorHandler.js';
import { createProperty, developerSession } from '../../../test/propertyFactories.js';
import { createTestApp } from '../../../test/testApp.js';
import { createPropertyRouter } from '../index.js';

// Access to /api/properties (PROP-006, PROP-DEC-011): authenticate → requireActiveDeveloper on every route,
// and every :id route answers 404 unless the caller owns the property.

jest.setTimeout(60_000); // sessions hash and compare passwords (bcrypt cost 12)

const errorOf = (res) => ({ status: res.status, code: res.body.error?.code });

describe('/api/properties access', () => {
  let app;
  beforeEach(() => {
    ({ app } = createTestApp());
  });

  it('is mounted: an Active Developer passes the guards (no route yet answers 404)', async () => {
    const { token } = await developerSession(app);
    const res = await request(app)
      .get('/api/properties/nothing-here')
      .set('Authorization', `Bearer ${token}`);
    expect(errorOf(res)).toEqual({ status: 404, code: 'NOT_FOUND' });
  });

  it('refuses a request without a valid token with 401 UNAUTHORIZED', async () => {
    expect(errorOf(await request(app).get('/api/properties'))).toEqual({ status: 401, code: 'UNAUTHORIZED' });
    const forged = await request(app).get('/api/properties').set('Authorization', 'Bearer not-a-jwt');
    expect(forged.status).toBe(401);
  });

  it('refuses a Buyer with 403 FORBIDDEN', async () => {
    const { token } = await developerSession(app, 'buyer');
    const res = await request(app).get('/api/properties').set('Authorization', `Bearer ${token}`);
    expect(errorOf(res)).toEqual({ status: 403, code: 'FORBIDDEN' });
  });

  it('refuses a Developer who is not Active with 403 DEVELOPER_NOT_ACTIVE', async () => {
    const { token } = await developerSession(app, 'notActive');
    const res = await request(app).get('/api/properties').set('Authorization', `Bearer ${token}`);
    expect(errorOf(res)).toEqual({ status: 403, code: 'DEVELOPER_NOT_ACTIVE' });
  });
});

// The :id guard, through probe routes added to the module's router (unique paths, so real routes never
// shadow them).
describe('owned property guard', () => {
  let app;
  let bodyRead;
  beforeEach(() => {
    const { app: realApp, storage, clock } = createTestApp();
    bodyRead = jest.fn();
    // Routes added after creation get the same guards (router.use and router.param apply to them).
    const probe = createPropertyRouter({ storage, clock });
    probe.get('/:id/__probe', (req, res) => res.json({ id: req.property.id }));
    // Stands in for a multipart route: the body parser must not run for a refused request.
    probe.post(
      '/:id/__probe-files',
      (_req, _res, next) => {
        bodyRead();
        next();
      },
      (_req, res) => res.status(201).end(),
    );
    app = express().use('/api/properties', probe).use(errorHandler);
    app.locals.realApp = realApp;
  });

  const sessionIn = (state) => developerSession(app.locals.realApp, state);

  it('loads the property when the caller owns it', async () => {
    const { account, token } = await sessionIn('active');
    const property = await createProperty(account.id);
    const res = await request(app)
      .get(`/api/properties/${property.id}/__probe`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: property.id });
  });

  it("answers another Developer's property and a missing id with the same 404", async () => {
    const owner = await sessionIn('active');
    const other = await sessionIn('active');
    const property = await createProperty(owner.account.id);

    const foreign = await request(app)
      .get(`/api/properties/${property.id}/__probe`)
      .set('Authorization', `Bearer ${other.token}`);
    const missing = await request(app)
      .get(`/api/properties/${property.id + 1000}/__probe`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: ERROR_CODES.NOT_FOUND.message },
    });
    expect(missing.body).toEqual(foreign.body);
  });

  it.each(['abc', '0', '-3', '1.5'])('refuses the id %s with 422 on id', async (id) => {
    const { token } = await sessionIn('active');
    const res = await request(app)
      .get(`/api/properties/${id}/__probe`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      fields: { id: [commonMessages.id.invalid] },
    });
  });

  it('checks the role and the owner before a multipart body is read', async () => {
    const owner = await sessionIn('active');
    const other = await sessionIn('active');
    const buyer = await sessionIn('buyer');
    const property = await createProperty(owner.account.id);
    const post = (token) =>
      request(app)
        .post(`/api/properties/${property.id}/__probe-files`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('%PDF-1.4'), 'a.pdf');

    expect((await post(buyer.token)).status).toBe(403);
    expect((await post(other.token)).status).toBe(404);
    expect(bodyRead).not.toHaveBeenCalled();
    expect((await post(owner.token)).status).toBe(201);
    expect(bodyRead).toHaveBeenCalledTimes(1);
  });
});
