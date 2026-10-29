import request from 'supertest';
import { authMessages, commonMessages, ERROR_CODES } from '@real-estate/shared';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import { ME, selectCountry, signUpAndVerify } from '../../../test/authFlows.js';
import { signAccessToken } from '../../../utils/jwt.js';

const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const errorBody = (code) => ({ success: false, error: { code, message: ERROR_CODES[code].message } });

describe('PUT /api/auth/me/country', () => {
  let app;
  let mailer;

  beforeEach(() => {
    ({ app, mailer } = createTestApp());
  });

  async function verifiedAccount(overrides) {
    const res = await signUpAndVerify(app, mailer, overrides);
    expect(res.status).toBe(200);
    return res.body.data;
  }

  it('stores the Buyer country and returns the user with it', async () => {
    const { accessToken, user } = await verifiedAccount();
    expect(user.preferredCountryCode).toBeNull();

    const res = await selectCountry(app, accessToken, 'SG');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { user: { ...user, preferredCountryCode: 'SG' } } });
    const stored = await models.User.findByPk(user.id);
    expect(stored.preferredCountryCode).toBe('SG');
    expect(res.text).not.toMatch(/passwordHash|password_hash|\$2[aby]\$/);
  });

  it('changes the country on a later call, and /me shows the new one', async () => {
    const { accessToken } = await verifiedAccount();
    expect((await selectCountry(app, accessToken, 'AE')).status).toBe(200);

    const res = await selectCountry(app, accessToken, 'GB');

    expect(res.status).toBe(200);
    expect(res.body.data.user.preferredCountryCode).toBe('GB');
    const me = await request(app).get(ME).set(bearer(accessToken));
    expect(me.body.data.user.preferredCountryCode).toBe('GB');
  });

  it('changes only the signed-in Account', async () => {
    const sara = await verifiedAccount();
    const omar = await verifiedAccount({ email: 'omar@example.com' });

    expect((await selectCountry(app, sara.accessToken, 'US')).status).toBe(200);

    expect((await models.User.findByPk(omar.user.id)).preferredCountryCode).toBeNull();
  });

  it('answers 403 FORBIDDEN for a developer-only Account and stores nothing', async () => {
    const { accessToken, user } = await verifiedAccount({ role: 'developer' });

    const res = await selectCountry(app, accessToken, 'AE');

    expect(res.status).toBe(403);
    expect(res.body).toEqual(errorBody('FORBIDDEN'));
    expect((await models.User.findByPk(user.id)).preferredCountryCode).toBeNull();
  });

  it('answers 403 before validation for a non-buyer', async () => {
    const { accessToken } = await verifiedAccount({ role: 'developer' });

    const res = await selectCountry(app, accessToken, 'IN');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('answers 401 without a token', async () => {
    const res = await request(app).put('/api/auth/me/country').send({ countryCode: 'AE' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual(errorBody('UNAUTHORIZED'));
  });

  it('answers 401 for a token that is not a valid access token', async () => {
    const res = await selectCountry(app, 'not.a.token', 'AE');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('answers 401 when the Account no longer exists', async () => {
    const { user } = await verifiedAccount();
    const token = signAccessToken({ userId: user.id, roles: ['buyer'] });
    await models.User.destroy({ where: { id: user.id } });

    const res = await selectCountry(app, token, 'AE');

    expect(res.status).toBe(401);
    expect(res.body).toEqual(errorBody('UNAUTHORIZED'));
  });

  it('answers 422 with the shared message for a country outside the list and keeps the old one', async () => {
    const { accessToken, user } = await verifiedAccount();
    await selectCountry(app, accessToken, 'AE');

    const res = await selectCountry(app, accessToken, 'IN');

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: commonMessages.invalidInput,
        fields: { countryCode: [authMessages.countryCode.invalid] },
      },
    });
    expect((await models.User.findByPk(user.id)).preferredCountryCode).toBe('AE');
  });
});
