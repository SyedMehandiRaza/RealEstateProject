import request from 'supertest';
import { ERROR_CODES } from '@real-estate/shared';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import { logIn, ME, signUpAndVerify } from '../../../test/authFlows.js';
import { signAccessToken } from '../../../utils/jwt.js';

const UNAUTHORIZED = {
  success: false,
  error: { code: 'UNAUTHORIZED', message: ERROR_CODES.UNAUTHORIZED.message },
};

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe('GET /api/auth/me', () => {
  let app;
  let mailer;

  beforeEach(() => {
    ({ app, mailer } = createTestApp());
  });

  it('returns the signed-in Account in the same user shape as login', async () => {
    expect((await signUpAndVerify(app, mailer)).status).toBe(200);
    const login = await logIn(app);

    const res = await request(app).get(ME).set(bearer(login.body.data.accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { user: login.body.data.user } });
    expect(res.body.data.user.developerVerificationStatus).toBeNull();
    expect(res.text).not.toMatch(/passwordHash|password_hash|\$2[aby]\$/);
  });

  it('answers 401 without a token', async () => {
    const res = await request(app).get(ME);
    expect(res.status).toBe(401);
    expect(res.body).toEqual(UNAUTHORIZED);
  });

  it('answers 401 for a token that is not a valid access token', async () => {
    const res = await request(app).get(ME).set(bearer('not.a.token'));
    expect(res.status).toBe(401);
    expect(res.body).toEqual(UNAUTHORIZED);
  });

  it('answers 401 when the Account no longer exists', async () => {
    const verified = await signUpAndVerify(app, mailer);
    const { id } = verified.body.data.user;
    const token = signAccessToken({ userId: id, roles: ['buyer'] });
    await models.User.destroy({ where: { id } });

    const res = await request(app).get(ME).set(bearer(token));
    expect(res.status).toBe(401);
    expect(res.body).toEqual(UNAUTHORIZED);
  });
});
