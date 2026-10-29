import request from 'supertest';
import { authMessages, commonMessages } from '@real-estate/shared';
import { env } from '../../../config/env.js';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import { signUp, signUpAndVerify, VERIFY_EMAIL } from '../../../test/authFlows.js';
import { hashToken, verifyAccessToken } from '../../../utils/jwt.js';
import { createVerificationCodeService } from '../verificationCode.service.js';

const EMAIL = 'sara@example.com';
const SECOND = 1000;
const MINUTE = 60 * SECOND;

const codeError = (message) => ({
  success: false,
  error: { code: 'VALIDATION_ERROR', message: commonMessages.invalidInput, fields: { code: [message] } },
});

// A code that is not the mailed one (the mailed code is never 000000 and 000001 at once).
const wrongCodeFor = (code) => (code === '000000' ? '000001' : '000000');

const refreshCookieOf = (res) =>
  (res.headers['set-cookie'] ?? []).find((cookie) => cookie.startsWith('refresh_token='));

describe('POST /api/auth/verify-email', () => {
  let app;
  let mailer;
  let clock;
  const verify = (body) => request(app).post(VERIFY_EMAIL).send(body);

  beforeEach(async () => {
    ({ app, mailer, clock } = createTestApp());
    await signUp(app, { email: EMAIL });
  });

  it('accepts the mailed code: verifies the email, returns the session and sets the refresh cookie', async () => {
    const user = await models.User.findOne({ where: { email: EMAIL } });

    const res = await verify({ email: EMAIL, code: mailer.lastCodeFor(EMAIL, 'email_verification') });

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

    const payload = verifyAccessToken(res.body.data.accessToken);
    expect(payload).toMatchObject({ sub: String(user.id), roles: ['buyer'] });

    const cookie = refreshCookieOf(res);
    expect(cookie).toMatch(/; Path=\/api\/auth/);
    expect(cookie).toMatch(/; HttpOnly/);
    expect(cookie).toMatch(/; SameSite=Strict/);
    const token = decodeURIComponent(cookie.split(';')[0].slice('refresh_token='.length));
    expect(JSON.stringify(res.body)).not.toContain(token);

    // The session is stored by hash only.
    const sessions = await models.RefreshToken.findAll();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ userId: user.id, tokenHash: hashToken(token), revokedAt: null });

    await user.reload();
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('matches the email whatever its case', async () => {
    const res = await verify({ email: 'SARA@Example.com', code: mailer.lastCodeFor(EMAIL) });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(EMAIL);
  });

  it('puts a Developer role in the session of a Developer', async () => {
    const res = await signUpAndVerify(app, mailer, { role: 'developer', email: 'dev@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.roles).toEqual(['developer']);
    expect(verifyAccessToken(res.body.data.accessToken).roles).toEqual(['developer']);
  });

  it('rejects a wrong code with codeInvalid and counts the attempt', async () => {
    const res = await verify({ email: EMAIL, code: wrongCodeFor(mailer.lastCodeFor(EMAIL)) });

    expect(res.status).toBe(422);
    expect(res.body).toEqual(codeError(authMessages.api.codeInvalid));
    expect(refreshCookieOf(res)).toBeUndefined();
    expect((await models.VerificationCode.findOne()).attempts).toBe(1);
    expect((await models.User.findOne()).emailVerifiedAt).toBeNull();
  });

  it('kills the code on the 5th wrong guess, so even the right code is then refused', async () => {
    const code = mailer.lastCodeFor(EMAIL);
    const wrong = wrongCodeFor(code);

    for (let guess = 1; guess <= 4; guess += 1) {
      expect((await verify({ email: EMAIL, code: wrong })).body).toEqual(
        codeError(authMessages.api.codeInvalid),
      );
    }
    const fifth = await verify({ email: EMAIL, code: wrong });
    const sixth = await verify({ email: EMAIL, code: wrong });
    const right = await verify({ email: EMAIL, code });

    expect(fifth.status).toBe(422);
    expect(fifth.body).toEqual(codeError(authMessages.api.codeTooManyAttempts));
    expect(sixth.body).toEqual(codeError(authMessages.api.codeTooManyAttempts));
    expect(right.status).toBe(422);
    expect(right.body).toEqual(codeError(authMessages.api.codeTooManyAttempts));
    expect((await models.User.findOne()).emailVerifiedAt).toBeNull();
  });

  // Signed up on a whole second and mid-second: DATETIME keeps whole seconds only.
  describe.each([0, 600])('expiry, signed up %i ms after a whole second', (offsetMs) => {
    beforeEach(async () => {
      clock.set(Math.floor(Date.now() / SECOND) * SECOND + offsetMs);
      await signUp(app, { email: 'late@example.com' });
    });

    it('accepts the code at 9:59', async () => {
      clock.advance(9 * MINUTE + 59 * SECOND);
      const res = await verify({ email: 'late@example.com', code: mailer.lastCodeFor('late@example.com') });
      expect(res.status).toBe(200);
    });

    it('rejects the code at 10:00 with codeInvalid', async () => {
      clock.advance(10 * MINUTE);
      const res = await verify({ email: 'late@example.com', code: mailer.lastCodeFor('late@example.com') });
      expect(res.status).toBe(422);
      expect(res.body).toEqual(codeError(authMessages.api.codeInvalid));
    });
  });

  // Issues another code for the Account straight through the Verification codes module (the resend
  // route arrives with TASK-020), always different from the mailed one.
  async function issueAnotherCode(purpose) {
    const mailed = mailer.lastCodeFor(EMAIL);
    const user = await models.User.findOne({ where: { email: EMAIL } });
    const codes = createVerificationCodeService({
      models,
      clock,
      secret: env.VERIFICATION_CODE_SECRET,
      random: () => (Number(mailed) + 1) % 1_000_000,
    });
    return codes.issue({ userId: user.id, purpose });
  }

  it('rejects an older code once a newer one exists, and accepts the newer one', async () => {
    const older = mailer.lastCodeFor(EMAIL);
    const newer = await issueAnotherCode('email_verification');

    expect((await verify({ email: EMAIL, code: older })).body).toEqual(
      codeError(authMessages.api.codeInvalid),
    );
    expect((await verify({ email: EMAIL, code: newer })).status).toBe(200);
  });

  it('does not accept a password_reset code', async () => {
    const resetCode = await issueAnotherCode('password_reset');

    expect((await verify({ email: EMAIL, code: resetCode })).body).toEqual(
      codeError(authMessages.api.codeInvalid),
    );
  });

  it('accepts a code only once', async () => {
    const code = mailer.lastCodeFor(EMAIL);
    expect((await verify({ email: EMAIL, code })).status).toBe(200);

    const again = await verify({ email: EMAIL, code });
    expect(again.status).toBe(422);
    expect(again.body).toEqual(codeError(authMessages.api.codeInvalid));
  });

  it('answers an unknown email like a wrong code', async () => {
    const res = await verify({ email: 'nobody@example.com', code: mailer.lastCodeFor(EMAIL) });
    expect(res.status).toBe(422);
    expect(res.body).toEqual(codeError(authMessages.api.codeInvalid));
  });
});
