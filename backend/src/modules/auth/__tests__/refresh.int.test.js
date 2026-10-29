import request from 'supertest';
import { ERROR_CODES } from '@real-estate/shared';
import { signUpCases } from '@real-estate/shared/testing';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import {
  LOGIN,
  LOGOUT,
  logIn,
  logOut,
  REFRESH,
  refresh,
  refreshTokenOf,
  signUpAndVerify,
} from '../../../test/authFlows.js';
import { hashToken, signAccessToken, signRefreshToken, verifyAccessToken } from '../../../utils/jwt.js';
import { REUSE_GRACE_MS } from '../session.service.js';

const EMAIL = signUpCases.valid.email;
const SECOND = 1000;

const UNAUTHORIZED = {
  success: false,
  error: { code: 'UNAUTHORIZED', message: ERROR_CODES.UNAUTHORIZED.message },
};

// Every login runs a real bcrypt compare (about 0.3 s).
jest.setTimeout(30 * SECOND);

const refreshCookieOf = (res) =>
  (res.headers['set-cookie'] ?? []).find((cookie) => cookie.startsWith('refresh_token='));

const rowOf = (token) => models.RefreshToken.findOne({ where: { tokenHash: hashToken(token) } });

describe('POST /api/auth/refresh', () => {
  let app;
  let mailer;
  let clock;
  let user;
  let token;

  // The refresh responses that must be refused, each with 401 UNAUTHORIZED and a cleared cookie.
  function expectRefused(res) {
    expect(res.status).toBe(401);
    expect(res.body).toEqual(UNAUTHORIZED);
    expect(refreshCookieOf(res)).toMatch(/^refresh_token=;.*Expires=Thu, 01 Jan 1970/);
    expect(refreshCookieOf(res)).toMatch(/Path=\/api\/auth/);
  }

  // A token revoked less than REUSE_GRACE_MS ago: 401, but the cookie is left alone, because another tab
  // may just have rotated it and the browser already holds the new one (TASK-053).
  function expectRefusedKeepingCookie(res) {
    expect(res.status).toBe(401);
    expect(res.body).toEqual(UNAUTHORIZED);
    expect(refreshCookieOf(res)).toBeUndefined();
  }

  const activeSessions = () => models.RefreshToken.count({ where: { userId: user.id, revokedAt: null } });

  beforeEach(async () => {
    ({ app, mailer, clock } = createTestApp());
    // revoked_at is a DATETIME without fractions: a whole-second clock keeps the grace boundary exact.
    clock.set(Math.floor(Date.now() / SECOND) * SECOND);
    const verified = await signUpAndVerify(app, mailer);
    expect(verified.status).toBe(200);
    token = refreshTokenOf(verified);
    user = await models.User.findOne({ where: { email: EMAIL } });
  });

  it('rotates a valid cookie: 200 { accessToken, user }, a new httpOnly cookie, the old token revoked', async () => {
    const login = await logIn(app);

    const res = await refresh(app, token);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { accessToken: expect.any(String), user: login.body.data.user },
    });
    expect(verifyAccessToken(res.body.data.accessToken)).toMatchObject({
      sub: String(user.id),
      roles: ['buyer'],
    });

    const cookie = refreshCookieOf(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/auth/);
    expect(cookie).toMatch(/SameSite=Strict/i);
    const newToken = refreshTokenOf(res);
    expect(newToken).not.toBe(token);
    expect(res.text).not.toContain(newToken);

    expect((await rowOf(token)).revokedAt).toBeInstanceOf(Date);
    const newRow = await rowOf(newToken);
    expect(newRow).toMatchObject({ userId: user.id, revokedAt: null });
  });

  it('works with a browser-like cookie jar: log in, refresh twice, log out, then refused', async () => {
    const browser = request.agent(app);
    const credentials = { email: EMAIL, password: signUpCases.valid.password };
    expect((await browser.post(LOGIN).send(credentials)).status).toBe(200);

    expect((await browser.post(REFRESH)).status).toBe(200);
    expect((await browser.post(REFRESH)).status).toBe(200);
    expect((await browser.post(LOGOUT)).status).toBe(204);

    expectRefused(await browser.post(REFRESH));
  });

  it('stores only token hashes, never a token', async () => {
    const res = await refresh(app, token);
    const newToken = refreshTokenOf(res);

    const rows = await models.RefreshToken.findAll({ raw: true });
    const stored = JSON.stringify(rows);
    expect(stored).not.toContain(token);
    expect(stored).not.toContain(newToken);
    for (const row of rows) expect(row.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('keeps a session alive through a chain of rotations, without the per-IP limiter', async () => {
    // The per-IP auth limiter allows 20 requests per 15 minutes; refresh is not throttled by it.
    for (let i = 0; i < 21; i += 1) {
      const res = await refresh(app, token);
      expect(res.status).toBe(200);
      token = refreshTokenOf(res);
    }
  });

  it("puts the Account's current roles in the new access token and user", async () => {
    await models.UserRole.create({ userId: user.id, role: 'developer' });

    const res = await refresh(app, token);

    expect(res.status).toBe(200);
    expect(res.body.data.user.roles).toEqual(['buyer', 'developer']);
    expect(verifyAccessToken(res.body.data.accessToken).roles).toEqual(['buyer', 'developer']);
  });

  it('answers 401 without a cookie', async () => {
    expectRefused(await refresh(app));
  });

  it('answers 401 for a token that is not a signed refresh token', async () => {
    expectRefused(await refresh(app, 'not-a-token'));
    expectRefused(await refresh(app, `${token}x`));
    // cookie-parser turns a "j:" cookie into an object.
    expectRefused(await refresh(app, 'j:{"token":1}'));
    expectRefused(await refresh(app, signAccessToken({ userId: user.id, roles: ['buyer'] })));
  });

  it('answers 401 for a correctly signed token that was never issued', async () => {
    expectRefused(await refresh(app, signRefreshToken({ userId: user.id }).token));
    // The real session is untouched.
    expect((await refresh(app, token)).status).toBe(200);
  });

  it('accepts a token until its expiry and answers 401 from the expiry on, without revoking other sessions', async () => {
    const { expiresAt } = await rowOf(token);
    const other = refreshTokenOf(await logIn(app));

    clock.set(new Date(expiresAt.getTime() - SECOND));
    const before = await refresh(app, token);
    expect(before.status).toBe(200);

    const next = refreshTokenOf(before);
    clock.set((await rowOf(other)).expiresAt);
    expectRefused(await refresh(app, other));
    // An expired token is not a reuse: the rotated session keeps working.
    clock.set(new Date(expiresAt.getTime() - SECOND));
    expect((await refresh(app, next)).status).toBe(200);
  });

  it('uses a 30 s grace window (DEC-039, Q-038)', () => {
    expect(REUSE_GRACE_MS).toBe(30 * SECOND);
  });

  it('answers a rotated token presented again 29 s later with 401 only: every session keeps working', async () => {
    const rotated = refreshTokenOf(await refresh(app, token));
    const otherSession = refreshTokenOf(await logIn(app));

    clock.advance(REUSE_GRACE_MS - SECOND);
    expectRefusedKeepingCookie(await refresh(app, token));

    expect(await activeSessions()).toBe(2);
    expect((await refresh(app, rotated)).status).toBe(200);
    expect((await refresh(app, otherSession)).status).toBe(200);
  });

  it('treats a rotated token presented again 30 s later as reuse: 401 and every session of the Account revoked', async () => {
    const rotated = refreshTokenOf(await refresh(app, token));
    const otherSession = refreshTokenOf(await logIn(app));

    clock.advance(REUSE_GRACE_MS);
    expectRefused(await refresh(app, token));

    // The reuse just revoked these, so they are inside the grace window too: 401, cookie left alone.
    expectRefusedKeepingCookie(await refresh(app, rotated));
    expectRefusedKeepingCookie(await refresh(app, otherSession));
    expect(await activeSessions()).toBe(0);
  });

  it('measures the grace window from the revocation, not from the first refused try', async () => {
    const rotated = refreshTokenOf(await refresh(app, token));

    clock.advance(REUSE_GRACE_MS - SECOND);
    expectRefusedKeepingCookie(await refresh(app, token));
    clock.advance(SECOND);
    expectRefused(await refresh(app, token));

    expectRefusedKeepingCookie(await refresh(app, rotated));
  });

  it("does not revoke another Account's sessions on reuse", async () => {
    const otherVerified = await signUpAndVerify(app, mailer, { email: 'omar@example.com' });
    const otherToken = refreshTokenOf(otherVerified);
    await refresh(app, token);

    clock.advance(REUSE_GRACE_MS);
    expectRefused(await refresh(app, token));

    expect((await refresh(app, otherToken)).status).toBe(200);
  });

  // The table cannot tell a rotated token from a logged-out one, so the grace window and the reuse rule
  // apply to a logged-out token too (DEC-028, DEC-039).
  it('answers a logged-out token presented to refresh within 30 s with 401 only', async () => {
    const otherSession = refreshTokenOf(await logIn(app));
    expect((await logOut(app, token)).status).toBe(204);

    clock.advance(REUSE_GRACE_MS - SECOND);
    expectRefusedKeepingCookie(await refresh(app, token));

    expect((await refresh(app, otherSession)).status).toBe(200);
  });

  it('treats a logged-out token presented to refresh 30 s later as reuse', async () => {
    const otherSession = refreshTokenOf(await logIn(app));
    expect((await logOut(app, token)).status).toBe(204);

    clock.advance(REUSE_GRACE_MS);
    expectRefused(await refresh(app, token));

    expectRefusedKeepingCookie(await refresh(app, otherSession));
  });

  it('answers 401 once the Account is deleted', async () => {
    await user.destroy();
    expectRefused(await refresh(app, token));
  });
});
