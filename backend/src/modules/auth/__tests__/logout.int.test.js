import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import { logIn, logOut, refresh, refreshTokenOf, signUpAndVerify } from '../../../test/authFlows.js';
import { hashToken } from '../../../utils/jwt.js';

// Every login runs a real bcrypt compare (about 0.3 s).
jest.setTimeout(30 * 1000);

const rowOf = (token) => models.RefreshToken.findOne({ where: { tokenHash: hashToken(token) } });

describe('POST /api/auth/logout', () => {
  let app;
  let token;

  // Every logout answers 204 with no body and clears the refresh cookie.
  function expectLoggedOut(res) {
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    const cookie = (res.headers['set-cookie'] ?? []).find((c) => c.startsWith('refresh_token='));
    expect(cookie).toMatch(/^refresh_token=;.*Expires=Thu, 01 Jan 1970/);
    expect(cookie).toMatch(/Path=\/api\/auth/);
    expect(cookie).toMatch(/HttpOnly/i);
  }

  beforeEach(async () => {
    let mailer;
    ({ app, mailer } = createTestApp());
    const verified = await signUpAndVerify(app, mailer);
    expect(verified.status).toBe(200);
    token = refreshTokenOf(verified);
  });

  it('revokes the presented token and clears the cookie', async () => {
    expectLoggedOut(await logOut(app, token));

    expect((await rowOf(token)).revokedAt).toBeInstanceOf(Date);
    expect((await refresh(app, token)).status).toBe(401);
  });

  it('ends only this session: another session of the Account keeps working', async () => {
    const otherSession = refreshTokenOf(await logIn(app));

    expectLoggedOut(await logOut(app, token));

    expect((await refresh(app, otherSession)).status).toBe(200);
  });

  it('answers 204 without a cookie, and with a cookie that is not a known token', async () => {
    expectLoggedOut(await logOut(app));
    expectLoggedOut(await logOut(app, 'not-a-token'));
    expectLoggedOut(await logOut(app, 'j:{"token":1}'));
    expect((await rowOf(token)).revokedAt).toBeNull();
  });

  it('answers 204 twice for the same token', async () => {
    expectLoggedOut(await logOut(app, token));
    expectLoggedOut(await logOut(app, token));
  });

  // ASSUMED (Q-038): logout never triggers reuse detection; it only ends the presented session.
  it('answers 204 for an already rotated token without revoking the rotated session', async () => {
    const rotated = refreshTokenOf(await refresh(app, token));

    expectLoggedOut(await logOut(app, token));

    expect((await refresh(app, rotated)).status).toBe(200);
  });
});
