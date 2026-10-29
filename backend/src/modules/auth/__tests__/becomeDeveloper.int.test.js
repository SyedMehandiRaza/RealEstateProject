import request from 'supertest';
import { ERROR_CODES } from '@real-estate/shared';
import { signUpCases } from '@real-estate/shared/testing';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import {
  becomeDeveloper,
  BECOME_DEVELOPER,
  ME,
  refresh,
  refreshTokenOf,
  selectCountry,
  signUp,
  signUpAndVerify,
} from '../../../test/authFlows.js';
import { signAccessToken, verifyAccessToken } from '../../../utils/jwt.js';

const bearer = (token) => ({ Authorization: `Bearer ${token}` });
const errorBody = (code) => ({ success: false, error: { code, message: ERROR_CODES[code].message } });
const rolesOf = (userId) =>
  models.UserRole.findAll({ where: { userId }, order: [['role', 'ASC']] }).then((rows) =>
    rows.map((row) => row.role),
  );

describe('POST /api/auth/me/roles/developer', () => {
  let app;
  let mailer;

  beforeEach(() => {
    ({ app, mailer } = createTestApp());
  });

  async function verifiedAccount(overrides) {
    const res = await signUpAndVerify(app, mailer, overrides);
    expect(res.status).toBe(200);
    return { ...res.body.data, refreshToken: refreshTokenOf(res) };
  }

  it('adds the Developer role to a Buyer and returns 201 { user } without a new token', async () => {
    const { accessToken, user } = await verifiedAccount();

    const res = await becomeDeveloper(app, accessToken);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: { user: { ...user, roles: ['buyer', 'developer'], developerVerificationStatus: 'under_review' } },
    });
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(await rolesOf(user.id)).toEqual(['buyer', 'developer']);
    const me = await request(app).get(ME).set(bearer(accessToken));
    expect(me.body.data.user.roles).toEqual(['buyer', 'developer']);
  });

  it('puts both roles into the access token of the next refresh', async () => {
    const { accessToken, refreshToken, user } = await verifiedAccount();
    expect(verifyAccessToken(accessToken).roles).toEqual(['buyer']);
    expect((await becomeDeveloper(app, accessToken)).status).toBe(201);

    const res = await refresh(app, refreshToken);

    expect(res.status).toBe(200);
    expect(res.body.data.user.roles).toEqual(['buyer', 'developer']);
    expect(verifyAccessToken(res.body.data.accessToken)).toMatchObject({
      sub: String(user.id),
      roles: ['buyer', 'developer'],
    });
  });

  it('keeps Buyer routes working for the same Account with the old and the refreshed token', async () => {
    const { accessToken, refreshToken } = await verifiedAccount();
    expect((await becomeDeveloper(app, accessToken)).status).toBe(201);
    const refreshed = (await refresh(app, refreshToken)).body.data.accessToken;

    const withOld = await selectCountry(app, accessToken, 'AE');
    const withNew = await selectCountry(app, refreshed, 'US');

    expect(withOld.status).toBe(200);
    expect(withNew.status).toBe(200);
    expect(withNew.body.data.user).toMatchObject({
      roles: ['buyer', 'developer'],
      preferredCountryCode: 'US',
    });
  });

  it('answers 409 CONFLICT when the Account is already a Developer, and adds nothing', async () => {
    const { accessToken, user } = await verifiedAccount();
    expect((await becomeDeveloper(app, accessToken)).status).toBe(201);

    const res = await becomeDeveloper(app, accessToken);

    expect(res.status).toBe(409);
    expect(res.body).toEqual(errorBody('CONFLICT'));
    expect(await rolesOf(user.id)).toEqual(['buyer', 'developer']);
  });

  it('answers 409 CONFLICT for an Account that signed up as a Developer', async () => {
    const { accessToken, user } = await verifiedAccount({ role: 'developer' });

    const res = await becomeDeveloper(app, accessToken);

    expect(res.status).toBe(409);
    expect(res.body).toEqual(errorBody('CONFLICT'));
    expect(await rolesOf(user.id)).toEqual(['developer']);
  });

  it('adds the role once when two requests race', async () => {
    const { accessToken, user } = await verifiedAccount();

    const answers = await Promise.all([becomeDeveloper(app, accessToken), becomeDeveloper(app, accessToken)]);

    expect(answers.map((res) => res.status).sort()).toEqual([201, 409]);
    expect(await rolesOf(user.id)).toEqual(['buyer', 'developer']);
  });

  it('answers 403 FORBIDDEN for an Account whose email is not verified', async () => {
    expect((await signUp(app)).status).toBe(201);
    const user = await models.User.findOne({ where: { email: signUpCases.valid.email } });
    const token = signAccessToken({ userId: user.id, roles: ['buyer'] });

    const res = await becomeDeveloper(app, token);

    expect(res.status).toBe(403);
    expect(res.body).toEqual(errorBody('FORBIDDEN'));
    expect(await rolesOf(user.id)).toEqual(['buyer']);
  });

  it('answers 401 without a token', async () => {
    const res = await request(app).post(BECOME_DEVELOPER);
    expect(res.status).toBe(401);
    expect(res.body).toEqual(errorBody('UNAUTHORIZED'));
  });

  it('answers 401 for a token that is not a valid access token', async () => {
    const res = await becomeDeveloper(app, 'not.a.token');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('answers 401 when the Account no longer exists', async () => {
    const { user } = await verifiedAccount();
    const token = signAccessToken({ userId: user.id, roles: ['buyer'] });
    await models.User.destroy({ where: { id: user.id } });

    const res = await becomeDeveloper(app, token);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(errorBody('UNAUTHORIZED'));
  });
});
