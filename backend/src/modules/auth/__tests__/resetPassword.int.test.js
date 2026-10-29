import request from 'supertest';
import { authMessages, commonMessages } from '@real-estate/shared';
import { signUpCases } from '@real-estate/shared/testing';
import { env } from '../../../config/env.js';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import {
  logIn,
  obtainResetToken,
  refresh,
  refreshTokenOf,
  RESET_PASSWORD,
  resetPassword,
  signUp,
  signUpAndVerify,
} from '../../../test/authFlows.js';
import { signAccessToken } from '../../../utils/jwt.js';
import { MAX_FAILED_LOGINS } from '../loginAttemptLimiter.js';
import { createResetTokens } from '../resetToken.js';

// TASK-024: POST /api/auth/password/reset (SPEC-001). Validation parity is in authValidation.test.js.

// Every reset hashes with bcrypt and every login compares with it (about 0.3 s each).
jest.setTimeout(30 * 1000);

const EMAIL = signUpCases.valid.email;
const OLD_PASSWORD = signUpCases.valid.password;
const NEW_PASSWORD = 'newpass12';
const SECOND = 1000;
const MINUTE = 60 * SECOND;

const CHANGED = { success: true, data: { message: authMessages.api.passwordChanged } };
const REFUSED = {
  success: false,
  error: { code: 'UNAUTHORIZED', message: authMessages.resetToken.required },
};
const wholeSecond = () => Math.floor(Date.now() / SECOND) * SECOND;

describe('POST /api/auth/password/reset', () => {
  let app;
  let mailer;
  let clock;
  const reset = (resetToken, password = NEW_PASSWORD) => resetPassword(app, { resetToken, password });
  const storedHash = async () =>
    (await models.User.scope('withPassword').findOne({ where: { email: EMAIL } })).passwordHash;

  beforeEach(() => {
    ({ app, mailer, clock } = createTestApp());
  });

  describe('with a valid reset token', () => {
    let verified;
    let resetToken;

    beforeEach(async () => {
      verified = await signUpAndVerify(app, mailer, { email: EMAIL });
      resetToken = await obtainResetToken(app, mailer, EMAIL);
    });

    it('answers { message: passwordChanged } and starts no session', async () => {
      const res = await reset(resetToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(CHANGED);
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('stores a bcrypt hash of the new password: the new one logs in and the old one fails', async () => {
      const before = await storedHash();
      expect((await reset(resetToken)).status).toBe(200);

      const after = await storedHash();
      expect(after).not.toBe(before);
      expect(after).toMatch(/^\$2[aby]\$12\$/);
      expect(after).not.toContain(NEW_PASSWORD);

      expect((await logIn(app, { email: EMAIL, password: NEW_PASSWORD })).status).toBe(200);
      const old = await logIn(app, { email: EMAIL, password: OLD_PASSWORD });
      expect(old.status).toBe(401);
      expect(old.body.error.message).toBe(authMessages.api.invalidCredentials);
    });

    it('revokes every refresh token of the Account, so every earlier cookie gets 401', async () => {
      const fromVerify = refreshTokenOf(verified);
      const fromLogin = refreshTokenOf(await logIn(app, { email: EMAIL, password: OLD_PASSWORD }));

      expect((await reset(resetToken)).status).toBe(200);

      expect(await models.RefreshToken.count({ where: { revokedAt: null } })).toBe(0);
      expect((await refresh(app, fromVerify)).status).toBe(401);
      expect((await refresh(app, fromLogin)).status).toBe(401);
    });

    it('leaves the sessions of other Accounts alone', async () => {
      const other = await signUpAndVerify(app, mailer, { email: 'omar@example.com' });

      expect((await reset(resetToken)).status).toBe(200);

      expect((await refresh(app, refreshTokenOf(other))).status).toBe(200);
    });

    it('refuses the same token a second time with resetToken.required and keeps the first new password', async () => {
      expect((await reset(resetToken)).status).toBe(200);

      const again = await reset(resetToken, 'another12');

      expect(again.status).toBe(401);
      expect(again.body).toEqual(REFUSED);
      expect((await logIn(app, { email: EMAIL, password: 'another12' })).status).toBe(401);
      expect((await logIn(app, { email: EMAIL, password: NEW_PASSWORD })).status).toBe(200);
    });

    it('lets only one of two concurrent resets with one token through', async () => {
      const answers = await Promise.all([reset(resetToken, 'first123'), reset(resetToken, 'second12')]);

      expect(answers.map((res) => res.status).sort()).toEqual([200, 401]);
    });

    // DEC-039 (Q-040): a successful reset clears the per-account login lockout for that email.
    it('clears the login lockout: after 10 failures and a reset, the new password logs in at once', async () => {
      for (let i = 0; i < MAX_FAILED_LOGINS; i += 1) {
        expect((await logIn(app, { email: EMAIL, password: 'wrongpass1' })).status).toBe(401);
      }
      expect((await logIn(app, { email: EMAIL, password: OLD_PASSWORD })).status).toBe(401);

      expect((await reset(resetToken)).status).toBe(200);

      expect((await logIn(app, { email: EMAIL, password: NEW_PASSWORD })).status).toBe(200);
    });

    it('keeps the lockout when the reset is refused', async () => {
      for (let i = 0; i < MAX_FAILED_LOGINS; i += 1) {
        expect((await logIn(app, { email: EMAIL, password: 'wrongpass1' })).status).toBe(401);
      }

      expect((await reset('not-a-reset-token')).status).toBe(401);

      expect((await logIn(app, { email: EMAIL, password: OLD_PASSWORD })).status).toBe(401);
    });

    it('accepts a reset to the same password as before', async () => {
      expect((await reset(resetToken, OLD_PASSWORD)).status).toBe(200);
      expect((await logIn(app, { email: EMAIL, password: OLD_PASSWORD })).status).toBe(200);
    });
  });

  it('refuses a token issued before the password changed', async () => {
    await signUpAndVerify(app, mailer, { email: EMAIL });
    const first = await obtainResetToken(app, mailer, EMAIL);
    clock.advance(MINUTE); // the resend cooldown
    const second = await obtainResetToken(app, mailer, EMAIL);

    expect((await reset(second)).status).toBe(200);

    const res = await reset(first, 'another12');
    expect(res.status).toBe(401);
    expect(res.body).toEqual(REFUSED);
  });

  // The token expires 10 minutes after it is issued (whole seconds, DEC-029).
  describe.each([0, 600])('token expiry, issued %i ms after a whole second', (offsetMs) => {
    let resetToken;

    beforeEach(async () => {
      await signUpAndVerify(app, mailer, { email: EMAIL });
      clock.set(wholeSecond() + offsetMs);
      resetToken = await obtainResetToken(app, mailer, EMAIL);
    });

    it('accepts the token at 9:59', async () => {
      clock.advance(9 * MINUTE + 59 * SECOND);
      expect((await reset(resetToken)).status).toBe(200);
    });

    it('refuses the token at 10:00 with resetToken.required and keeps the old password', async () => {
      const before = await storedHash();
      clock.advance(10 * MINUTE);

      const res = await reset(resetToken);

      expect(res.status).toBe(401);
      expect(res.body).toEqual(REFUSED);
      expect(await storedHash()).toBe(before);
    });
  });

  describe('refuses a token that is not a live reset token with resetToken.required', () => {
    let userId;

    beforeEach(async () => {
      await signUpAndVerify(app, mailer, { email: EMAIL });
      userId = (await models.User.findOne({ where: { email: EMAIL } })).id;
    });

    it.each([
      ['a random string', () => 'not-a-token'],
      ['an access token of the Account', () => signAccessToken({ userId, roles: ['buyer'] })],
      [
        'a reset token signed with another secret',
        async () =>
          createResetTokens({ parentSecret: 'another-secret-of-at-least-32-chars!', clock }).issue({
            userId,
            passwordHash: await storedHash(),
          }),
      ],
      [
        'a reset token for an Account that does not exist',
        async () =>
          createResetTokens({ parentSecret: env.JWT_ACCESS_SECRET, clock }).issue({
            userId: userId + 1000,
            passwordHash: await storedHash(),
          }),
      ],
    ])('%s', async (_name, tokenFor) => {
      const before = await storedHash();

      const res = await reset(await tokenFor());

      expect(res.status).toBe(401);
      expect(res.body).toEqual(REFUSED);
      expect(await storedHash()).toBe(before);
      expect(await models.RefreshToken.count({ where: { revokedAt: null } })).toBe(1);
    });
  });

  it('resets an Account that never verified its email without verifying it (Q-039)', async () => {
    await signUp(app, { email: EMAIL });
    const resetToken = await obtainResetToken(app, mailer, EMAIL);

    expect((await reset(resetToken)).status).toBe(200);

    expect((await models.User.findOne({ where: { email: EMAIL } })).emailVerifiedAt).toBeNull();
    const login = await logIn(app, { email: EMAIL, password: NEW_PASSWORD });
    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('answers a missing token with 422 and resetToken.required before checking anything', async () => {
    const res = await request(app)
      .post(RESET_PASSWORD)
      .send({ password: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: commonMessages.invalidInput,
        fields: { resetToken: [authMessages.resetToken.required] },
      },
    });
  });
});
