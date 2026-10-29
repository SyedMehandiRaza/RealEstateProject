import request from 'supertest';
import { authMessages, commonMessages } from '@real-estate/shared';
import { env } from '../../../config/env.js';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import {
  forgotPassword,
  ME,
  resendPasswordReset,
  signUp,
  signUpAndVerify,
  VERIFY_EMAIL,
  verifyPasswordReset,
} from '../../../test/authFlows.js';
import { logger } from '../../../utils/logger.js';
import { createResetTokens } from '../resetToken.js';

// TASK-023: POST /password/forgot, /password/resend and /password/verify (SPEC-001). The reset itself
// (POST /password/reset) is TASK-024.

const EMAIL = 'sara@example.com';
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const RESET = 'password_reset';

const SENT = { success: true, data: { sent: true } };
const tooManyRequests = (message) => ({ success: false, error: { code: 'TOO_MANY_REQUESTS', message } });
const codeError = (message) => ({
  success: false,
  error: { code: 'VALIDATION_ERROR', message: commonMessages.invalidInput, fields: { code: [message] } },
});
const wrongCodeFor = (code) => (code === '000000' ? '000001' : '000000');
const wholeSecond = () => Math.floor(Date.now() / SECOND) * SECOND;

describe('password reset codes', () => {
  let app;
  let mailer;
  let clock;
  const resetCodesSent = (email = EMAIL) =>
    mailer.messages.filter((m) => m.to === email && m.purpose === RESET);
  const resetRows = () => models.VerificationCode.count({ where: { purpose: RESET } });
  const forgot = (email = EMAIL) => forgotPassword(app, email);
  const resend = (email = EMAIL) => resendPasswordReset(app, email);
  const verify = (code, email = EMAIL) => verifyPasswordReset(app, { email, code });

  beforeEach(() => {
    ({ app, mailer, clock } = createTestApp());
  });

  describe('POST /api/auth/password/forgot', () => {
    it('mails one password_reset code to a known email and answers { sent: true }', async () => {
      await signUpAndVerify(app, mailer, { email: EMAIL });

      const res = await forgot();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(SENT);
      expect(resetCodesSent()).toHaveLength(1);
      expect(resetCodesSent()[0].code).toMatch(/^\d{6}$/);
      expect(await resetRows()).toBe(1);
    });

    it('answers an unknown email with the identical body and sends nothing', async () => {
      await signUpAndVerify(app, mailer, { email: EMAIL });
      const known = await forgot();

      const unknown = await forgot('nobody@example.com');

      expect(unknown.status).toBe(known.status);
      expect(unknown.body).toEqual(known.body);
      expect(resetCodesSent('nobody@example.com')).toEqual([]);
      expect(await resetRows()).toBe(1);
    });

    it('also mails a code to an Account that never verified its email (Q-039)', async () => {
      await signUp(app, { email: EMAIL });
      const res = await forgot();
      expect(res.status).toBe(200);
      expect(resetCodesSent()).toHaveLength(1);
    });

    it('matches the email whatever its case', async () => {
      await signUpAndVerify(app, mailer, { email: EMAIL });
      expect((await forgot('  SARA@Example.com ')).status).toBe(200);
      expect(resetCodesSent()).toHaveLength(1);
    });

    it('is not slowed by the sign-up code: the cooldown is per purpose', async () => {
      await signUp(app, { email: EMAIL });
      expect((await forgot()).status).toBe(200);
    });

    it('answers as on success when the email cannot be sent, logging only the Account id and purpose (Q-037)', async () => {
      await signUpAndVerify(app, mailer, { email: EMAIL });
      const logError = jest.spyOn(logger, 'error').mockImplementation(() => {});
      mailer.failNextSends(1);

      const res = await forgot();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(SENT);
      expect(await resetRows()).toBe(1);
      expect(logError).toHaveBeenCalledTimes(1);
      expect(Object.keys(logError.mock.calls[0][0]).sort()).toEqual(['err', 'purpose', 'userId']);
      expect(logError.mock.calls[0][0].purpose).toBe(RESET);
      expect(JSON.stringify(logError.mock.calls[0])).not.toContain(EMAIL);
      logError.mockRestore();
    });
  });

  // DATETIME keeps whole seconds only, so the 60-second edge is checked from a whole second and mid-second.
  describe.each([0, 600])('resend rules, first code %i ms after a whole second', (offsetMs) => {
    beforeEach(async () => {
      await signUpAndVerify(app, mailer, { email: EMAIL });
      clock.set(wholeSecond() + offsetMs);
      expect((await forgot()).status).toBe(200);
    });

    it('refuses another code right away with resendTooSoon(60), from forgot and from resend', async () => {
      const again = await forgot();
      const resent = await resend();

      expect(again.status).toBe(429);
      expect(again.body).toEqual(tooManyRequests(authMessages.api.resendTooSoon(60)));
      expect(resent.status).toBe(429);
      expect(resent.body).toEqual(tooManyRequests(authMessages.api.resendTooSoon(60)));
      expect(resetCodesSent()).toHaveLength(1);
    });

    it('refuses a resend at 59 s with resendTooSoon(1), with no email and no row', async () => {
      clock.advance(59 * SECOND);
      const res = await resend();
      expect(res.status).toBe(429);
      expect(res.body).toEqual(tooManyRequests(authMessages.api.resendTooSoon(1)));
      expect(resetCodesSent()).toHaveLength(1);
      expect(await resetRows()).toBe(1);
    });

    it('sends a new code at 60 s, and only the new code is accepted', async () => {
      const first = mailer.lastCodeFor(EMAIL, RESET);
      clock.advance(60 * SECOND);

      const res = await resend();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(SENT);
      expect(resetCodesSent()).toHaveLength(2);
      const second = mailer.lastCodeFor(EMAIL, RESET);
      // The codes collide only by chance (1 in a million); newest-only is also covered in verifyEmail tests.
      if (second !== first)
        expect((await verify(first)).body).toEqual(codeError(authMessages.api.codeInvalid));
      expect((await verify(second)).status).toBe(200);
    });
  });

  describe('hourly cap', () => {
    let start;

    // Forgot plus 4 resends, 60 s apart: 5 password_reset codes in the hour.
    beforeEach(async () => {
      await signUpAndVerify(app, mailer, { email: EMAIL });
      start = wholeSecond();
      clock.set(start);
      expect((await forgot()).status).toBe(200);
      for (let i = 1; i <= 4; i += 1) {
        clock.advance(MINUTE);
        expect((await resend()).status).toBe(200);
      }
      expect(resetCodesSent()).toHaveLength(5);
    });

    it('refuses a 6th code within the hour with resendLimit, from resend and from forgot', async () => {
      clock.advance(MINUTE);
      expect((await resend()).body).toEqual(tooManyRequests(authMessages.api.resendLimit));
      clock.set(start + HOUR - SECOND);
      const res = await forgot();
      expect(res.status).toBe(429);
      expect(res.body).toEqual(tooManyRequests(authMessages.api.resendLimit));
      expect(resetCodesSent()).toHaveLength(5);
    });

    it('allows a code again once the first one is an hour old', async () => {
      clock.set(start + HOUR);
      expect((await resend()).status).toBe(200);
      expect(resetCodesSent()).toHaveLength(6);
    });
  });

  describe('POST /api/auth/password/resend', () => {
    it('answers an unknown email with { sent: true } and sends nothing', async () => {
      const res = await resend('nobody@example.com');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(SENT);
      expect(mailer.messages).toEqual([]);
      expect(await models.VerificationCode.count()).toBe(0);
    });

    it('sends a code even when none was asked for yet', async () => {
      await signUpAndVerify(app, mailer, { email: EMAIL });
      expect((await resend()).body).toEqual(SENT);
      expect(resetCodesSent()).toHaveLength(1);
    });
  });

  describe('POST /api/auth/password/verify', () => {
    beforeEach(async () => {
      await signUpAndVerify(app, mailer, { email: EMAIL });
      await forgot();
    });

    it('returns a 10-minute reset token for the Account and its current password, and no session', async () => {
      const user = await models.User.scope('withPassword').findOne({ where: { email: EMAIL } });

      const res = await verify(mailer.lastCodeFor(EMAIL, RESET));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { resetToken: expect.any(String) } });
      expect(res.headers['set-cookie']).toBeUndefined();

      const tokens = createResetTokens({ parentSecret: env.JWT_ACCESS_SECRET, clock });
      const claims = tokens.read(res.body.data.resetToken);
      expect(claims).toEqual({ userId: user.id, fingerprint: expect.any(String) });
      expect(tokens.matchesPassword(claims, user.passwordHash)).toBe(true);
      expect(res.body.data.resetToken).not.toContain(user.passwordHash);
      expect(await models.RefreshToken.count()).toBe(1); // only the one from verifying the email
    });

    it('issues a token that is not an access token', async () => {
      const { body } = await verify(mailer.lastCodeFor(EMAIL, RESET));
      const me = await request(app).get(ME).set('Authorization', `Bearer ${body.data.resetToken}`);
      expect(me.status).toBe(401);
    });

    it('accepts a code only once', async () => {
      const code = mailer.lastCodeFor(EMAIL, RESET);
      expect((await verify(code)).status).toBe(200);
      const again = await verify(code);
      expect(again.status).toBe(422);
      expect(again.body).toEqual(codeError(authMessages.api.codeInvalid));
    });

    it('matches the email whatever its case', async () => {
      expect((await verify(mailer.lastCodeFor(EMAIL, RESET), 'SARA@Example.com')).status).toBe(200);
    });

    it('rejects a wrong code with codeInvalid and counts the attempt', async () => {
      const res = await verify(wrongCodeFor(mailer.lastCodeFor(EMAIL, RESET)));
      expect(res.status).toBe(422);
      expect(res.body).toEqual(codeError(authMessages.api.codeInvalid));
      expect((await models.VerificationCode.findOne({ where: { purpose: RESET } })).attempts).toBe(1);
    });

    it('kills the code on the 5th wrong guess, so even the right code is then refused', async () => {
      const code = mailer.lastCodeFor(EMAIL, RESET);
      const wrong = wrongCodeFor(code);
      for (let guess = 1; guess <= 4; guess += 1) {
        expect((await verify(wrong)).body).toEqual(codeError(authMessages.api.codeInvalid));
      }
      expect((await verify(wrong)).body).toEqual(codeError(authMessages.api.codeTooManyAttempts));
      expect((await verify(wrong)).body).toEqual(codeError(authMessages.api.codeTooManyAttempts));
      const right = await verify(code);
      expect(right.status).toBe(422);
      expect(right.body).toEqual(codeError(authMessages.api.codeTooManyAttempts));
    });

    it('answers an unknown email as a wrong code', async () => {
      const res = await verify('012345', 'nobody@example.com');
      expect(res.status).toBe(422);
      expect(res.body).toEqual(codeError(authMessages.api.codeInvalid));
    });
  });

  describe.each([0, 600])('code expiry, issued %i ms after a whole second', (offsetMs) => {
    beforeEach(async () => {
      await signUpAndVerify(app, mailer, { email: EMAIL });
      clock.set(wholeSecond() + offsetMs);
      await forgot();
    });

    it('accepts the code at 9:59', async () => {
      clock.advance(9 * MINUTE + 59 * SECOND);
      expect((await verify(mailer.lastCodeFor(EMAIL, RESET))).status).toBe(200);
    });

    it('rejects the code at 10:00 with codeInvalid', async () => {
      clock.advance(10 * MINUTE);
      const res = await verify(mailer.lastCodeFor(EMAIL, RESET));
      expect(res.status).toBe(422);
      expect(res.body).toEqual(codeError(authMessages.api.codeInvalid));
    });
  });

  describe('purposes do not mix', () => {
    // An unverified Account holds a live email_verification code and a live password_reset code.
    let emailCode;
    let resetCode;

    beforeEach(async () => {
      await signUp(app, { email: EMAIL });
      await forgot();
      emailCode = mailer.lastCodeFor(EMAIL, 'email_verification');
      resetCode = mailer.lastCodeFor(EMAIL, RESET);
    });

    it('does not accept an email_verification code at /password/verify', async () => {
      if (emailCode === resetCode) return; // 1 in a million
      const res = await verify(emailCode);
      expect(res.status).toBe(422);
      expect(res.body).toEqual(codeError(authMessages.api.codeInvalid));
    });

    it('does not accept a password_reset code at /verify-email', async () => {
      if (emailCode === resetCode) return; // 1 in a million
      const res = await request(app).post(VERIFY_EMAIL).send({ email: EMAIL, code: resetCode });
      expect(res.status).toBe(422);
      expect(res.body).toEqual(codeError(authMessages.api.codeInvalid));
    });

    it('verifying the reset code does not verify the email', async () => {
      expect((await verify(resetCode)).status).toBe(200);
      expect((await models.User.findOne({ where: { email: EMAIL } })).emailVerifiedAt).toBeNull();
    });
  });
});
