import request from 'supertest';
import { authMessages } from '@real-estate/shared';
import { signUpCases } from '@real-estate/shared/testing';
import { resetRateLimiters } from '../../../middlewares/rateLimiter.js';
import models, { sequelize } from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import { logIn, signUp, signUpAndVerify, VERIFY_EMAIL } from '../../../test/authFlows.js';
import { hashToken, verifyAccessToken } from '../../../utils/jwt.js';
import { logger } from '../../../utils/logger.js';
import { FAILED_LOGIN_WINDOW_MS, MAX_FAILED_LOGINS } from '../loginAttemptLimiter.js';

const EMAIL = signUpCases.valid.email;
const WRONG_PASSWORD = 'wrong-password1';
const SECOND = 1000;
const MINUTE = 60 * SECOND;

const INVALID_CREDENTIALS = {
  success: false,
  error: { code: 'UNAUTHORIZED', message: authMessages.api.invalidCredentials },
};
const EMAIL_NOT_VERIFIED = {
  success: false,
  error: { code: 'EMAIL_NOT_VERIFIED', message: authMessages.api.emailNotVerified },
};

// Every login runs a real bcrypt compare (cost 12, about 0.3 s), and the limit tests make up to 12 of them.
jest.setTimeout(30 * SECOND);

const refreshCookieOf = (res) =>
  (res.headers['set-cookie'] ?? []).find((cookie) => cookie.startsWith('refresh_token='));

describe('POST /api/auth/login', () => {
  let app;
  let mailer;
  let clock;
  const codesSent = () => mailer.messages.filter((m) => m.to === EMAIL);

  // `count` logins with a wrong password, each refused with invalidCredentials.
  async function failLogins(count, email = EMAIL) {
    for (let i = 0; i < count; i += 1) {
      const res = await logIn(app, { email, password: WRONG_PASSWORD });
      expect(res.status).toBe(401);
      expect(res.body).toEqual(INVALID_CREDENTIALS);
    }
  }

  beforeEach(() => {
    ({ app, mailer, clock } = createTestApp());
  });

  describe('a verified Account', () => {
    beforeEach(async () => {
      expect((await signUpAndVerify(app, mailer)).status).toBe(200);
    });

    it('logs in: returns the access token and user, and sets the httpOnly refresh cookie', async () => {
      const user = await models.User.findOne({ where: { email: EMAIL } });

      const res = await logIn(app);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: {
          accessToken: expect.any(String),
          user: {
            id: user.id,
            fullName: 'Sara Khan',
            email: EMAIL,
            phone: '+971501234567',
            roles: ['buyer'],
            emailVerified: true,
            preferredCountryCode: null,
            developerVerificationStatus: null,
          },
        },
      });
      expect(verifyAccessToken(res.body.data.accessToken)).toMatchObject({
        sub: String(user.id),
        roles: ['buyer'],
      });

      const cookie = refreshCookieOf(res);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/Path=\/api\/auth/);
      expect(cookie).toMatch(/SameSite=Strict/i);
      const token = decodeURIComponent(cookie.split(';')[0].slice('refresh_token='.length));
      const stored = await models.RefreshToken.findAll({ where: { userId: user.id } });
      // One from verify-email, one from this login; only hashes are stored.
      expect(stored).toHaveLength(2);
      expect(stored.map((row) => row.tokenHash)).toContain(hashToken(token));
      expect(stored.map((row) => row.tokenHash)).not.toContain(token);
    });

    it('matches the email whatever its case', async () => {
      expect((await logIn(app, { email: '  SARA@Example.com ' })).status).toBe(200);
    });

    it('refuses a wrong password with invalidCredentials and no cookie', async () => {
      const res = await logIn(app, { password: WRONG_PASSWORD });
      expect(res.status).toBe(401);
      expect(res.body).toEqual(INVALID_CREDENTIALS);
      expect(refreshCookieOf(res)).toBeUndefined();
    });

    it('reads the Account and its roles in one query (no N+1)', async () => {
      const query = jest.spyOn(sequelize, 'query');
      try {
        expect((await logIn(app)).status).toBe(200);
        const selects = query.mock.calls.map(([sql]) => String(sql)).filter((sql) => /^\s*SELECT/i.test(sql));
        expect(selects).toHaveLength(1);
        expect(selects[0]).toMatch(/`users`/);
        expect(selects[0]).toMatch(/`user_roles`/);
      } finally {
        query.mockRestore();
      }
    });

    it('never puts the password hash in a response or a log', async () => {
      const { passwordHash } = await models.User.scope('withPassword').findOne({ where: { email: EMAIL } });
      const logged = ['error', 'warn', 'info', 'debug'].map((level) =>
        jest.spyOn(logger, level).mockImplementation(() => {}),
      );
      try {
        const responses = [await logIn(app), await logIn(app, { password: WRONG_PASSWORD })];
        for (const res of responses) {
          expect(res.text).not.toContain(passwordHash);
          expect(res.text).not.toMatch(/passwordHash|password_hash/);
        }
        for (const spy of logged) expect(JSON.stringify(spy.mock.calls)).not.toContain(passwordHash);
      } finally {
        logged.forEach((spy) => spy.mockRestore());
      }
    });
  });

  it('logs in a Developer with the developer role', async () => {
    expect((await signUpAndVerify(app, mailer, { role: 'developer' })).status).toBe(200);
    const res = await logIn(app);
    expect(res.status).toBe(200);
    expect(res.body.data.user.roles).toEqual(['developer']);
  });

  it('refuses an unknown email with the same body as a wrong password', async () => {
    const res = await logIn(app, { email: 'nobody@example.com' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual(INVALID_CREDENTIALS);
    expect(mailer.messages).toEqual([]);
  });

  describe('per-account failed-login limit (10 per 15 minutes, DEC-022)', () => {
    beforeEach(async () => {
      clock.set(Math.floor(Date.now() / SECOND) * SECOND);
      expect((await signUpAndVerify(app, mailer)).status).toBe(200);
    });

    it('checks the 10th attempt: 9 failures, then the right password logs in', async () => {
      await failLogins(MAX_FAILED_LOGINS - 1);
      expect((await logIn(app)).status).toBe(200);
    });

    it('refuses the 11th attempt with invalidCredentials even with the right password', async () => {
      await failLogins(MAX_FAILED_LOGINS);
      const res = await logIn(app);
      expect(res.status).toBe(401);
      expect(res.body).toEqual(INVALID_CREDENTIALS);
      expect(refreshCookieOf(res)).toBeUndefined();
    });

    it('counts per email: another Account still logs in', async () => {
      await failLogins(MAX_FAILED_LOGINS);
      await resetRateLimiters();
      expect((await signUpAndVerify(app, mailer, { email: 'omar@example.com' })).status).toBe(200);
      expect((await logIn(app, { email: 'omar@example.com' })).status).toBe(200);
    });

    it('a success resets the count', async () => {
      await failLogins(MAX_FAILED_LOGINS - 1);
      expect((await logIn(app)).status).toBe(200);
      // The per-IP limiter (20 per 15 min) would trip first; it is not what this test checks.
      await resetRateLimiters();

      await failLogins(MAX_FAILED_LOGINS - 1);
      expect((await logIn(app)).status).toBe(200);
    });

    it('lets the right password in again once the failures are 15 minutes old', async () => {
      await failLogins(MAX_FAILED_LOGINS);
      clock.advance(FAILED_LOGIN_WINDOW_MS - SECOND);
      expect((await logIn(app)).status).toBe(401);

      clock.advance(SECOND);
      expect((await logIn(app)).status).toBe(200);
    });
  });

  it('counts failures for an email that has no Account yet', async () => {
    await failLogins(MAX_FAILED_LOGINS);
    expect((await signUpAndVerify(app, mailer)).status).toBe(200);
    const res = await logIn(app);
    expect(res.status).toBe(401);
    expect(res.body).toEqual(INVALID_CREDENTIALS);
  });

  describe('an unverified Account', () => {
    beforeEach(async () => {
      clock.set(Math.floor(Date.now() / SECOND) * SECOND);
      expect((await signUp(app)).status).toBe(201);
    });

    it('answers 403 EMAIL_NOT_VERIFIED with no session, and no new code inside the 60 s cooldown', async () => {
      const res = await logIn(app);
      expect(res.status).toBe(403);
      expect(res.body).toEqual(EMAIL_NOT_VERIFIED);
      expect(refreshCookieOf(res)).toBeUndefined();
      expect(await models.RefreshToken.count()).toBe(0);
      expect(codesSent()).toHaveLength(1);
      expect(await models.VerificationCode.count()).toBe(1);
    });

    it('mails one new code once the cooldown is over, and that code verifies the email', async () => {
      clock.advance(MINUTE);
      const res = await logIn(app);
      expect(res.status).toBe(403);
      expect(res.body).toEqual(EMAIL_NOT_VERIFIED);
      expect(codesSent()).toHaveLength(2);
      expect(mailer.messages.at(-1)).toMatchObject({ to: EMAIL, purpose: 'email_verification' });

      const verify = await request(app)
        .post(VERIFY_EMAIL)
        .send({ email: EMAIL, code: mailer.lastCodeFor(EMAIL, 'email_verification') });
      expect(verify.status).toBe(200);
      expect((await logIn(app)).status).toBe(200);
    });

    it('sends no code past the hourly cap and still answers EMAIL_NOT_VERIFIED', async () => {
      // Sign-up's code plus 4 logins a minute apart: 5 codes in the hour.
      for (let i = 0; i < 4; i += 1) {
        clock.advance(MINUTE);
        expect((await logIn(app)).status).toBe(403);
      }
      expect(codesSent()).toHaveLength(5);

      clock.advance(MINUTE);
      const res = await logIn(app);
      expect(res.status).toBe(403);
      expect(res.body).toEqual(EMAIL_NOT_VERIFIED);
      expect(codesSent()).toHaveLength(5);
    });

    it('refuses a wrong password with invalidCredentials and sends no code', async () => {
      clock.advance(MINUTE);
      const res = await logIn(app, { password: WRONG_PASSWORD });
      expect(res.status).toBe(401);
      expect(res.body).toEqual(INVALID_CREDENTIALS);
      expect(codesSent()).toHaveLength(1);
    });

    it('still answers EMAIL_NOT_VERIFIED when the email cannot be sent, logging only the Account id and purpose (Q-037)', async () => {
      clock.advance(MINUTE);
      const logError = jest.spyOn(logger, 'error').mockImplementation(() => {});
      mailer.failNextSends(1);
      try {
        const res = await logIn(app);

        expect(res.status).toBe(403);
        expect(res.body).toEqual(EMAIL_NOT_VERIFIED);
        expect(await models.VerificationCode.count()).toBe(2);
        expect(logError).toHaveBeenCalledTimes(1);
        expect(Object.keys(logError.mock.calls[0][0]).sort()).toEqual(['err', 'purpose', 'userId']);
        expect(JSON.stringify(logError.mock.calls[0])).not.toContain(EMAIL);
      } finally {
        logError.mockRestore();
      }
    });
  });
});
