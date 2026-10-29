import request from 'supertest';
import { authMessages, commonMessages } from '@real-estate/shared';
import { env } from '../../../config/env.js';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import { resendVerification, signUp, signUpAndVerify, VERIFY_EMAIL } from '../../../test/authFlows.js';
import { logger } from '../../../utils/logger.js';
import { createVerificationCodeService } from '../verificationCode.service.js';

const EMAIL = 'sara@example.com';
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const SENT = { success: true, data: { sent: true } };
const tooManyRequests = (message) => ({ success: false, error: { code: 'TOO_MANY_REQUESTS', message } });

describe('POST /api/auth/verify-email/resend', () => {
  let app;
  let mailer;
  let clock;
  const resend = (email = EMAIL) => resendVerification(app, email);
  const verify = (code) => request(app).post(VERIFY_EMAIL).send({ email: EMAIL, code });
  const codesSent = () => mailer.messages.filter((m) => m.to === EMAIL);

  beforeEach(() => {
    ({ app, mailer, clock } = createTestApp());
  });

  // DATETIME keeps whole seconds only, so the 60-second edge is checked from a whole second and mid-second.
  describe.each([0, 600])('cooldown, signed up %i ms after a whole second', (offsetMs) => {
    beforeEach(async () => {
      clock.set(Math.floor(Date.now() / SECOND) * SECOND + offsetMs);
      await signUp(app, { email: EMAIL });
    });

    it('refuses a resend right after sign-up with resendTooSoon(60)', async () => {
      const res = await resend();
      expect(res.status).toBe(429);
      expect(res.body).toEqual(tooManyRequests(authMessages.api.resendTooSoon(60)));
      expect(codesSent()).toHaveLength(1);
    });

    it('refuses a resend at 59 s with resendTooSoon(1) and sends no email', async () => {
      clock.advance(59 * SECOND);
      const res = await resend();
      expect(res.status).toBe(429);
      expect(res.body).toEqual(tooManyRequests(authMessages.api.resendTooSoon(1)));
      expect(codesSent()).toHaveLength(1);
      expect(await models.VerificationCode.count()).toBe(1);
    });

    it('sends a new code at 60 s, and only the new code verifies', async () => {
      const first = mailer.lastCodeFor(EMAIL, 'email_verification');
      clock.advance(60 * SECOND);

      const res = await resend();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(SENT);
      expect(codesSent()).toHaveLength(2);
      expect(mailer.messages.at(-1)).toMatchObject({ to: EMAIL, purpose: 'email_verification' });
      const second = mailer.lastCodeFor(EMAIL, 'email_verification');

      // The two codes can only collide by chance (1 in a million); the newest-only rule is still covered
      // by verifyEmail.int.test.js with forced-different codes.
      if (second !== first) {
        const old = await verify(first);
        expect(old.status).toBe(422);
        expect(old.body).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: commonMessages.invalidInput,
            fields: { code: [authMessages.api.codeInvalid] },
          },
        });
      }
      expect((await verify(second)).status).toBe(200);
    });
  });

  describe('hourly cap', () => {
    let start;

    // Sign-up's code plus 4 resends, 60 s apart: 5 codes in the hour.
    beforeEach(async () => {
      start = Math.floor(Date.now() / SECOND) * SECOND;
      clock.set(start);
      await signUp(app, { email: EMAIL });
      for (let i = 1; i <= 4; i += 1) {
        clock.advance(MINUTE);
        expect((await resend()).status).toBe(200);
      }
      expect(codesSent()).toHaveLength(5);
    });

    it('refuses a 6th code within the hour with resendLimit', async () => {
      clock.advance(MINUTE);
      const res = await resend();
      expect(res.status).toBe(429);
      expect(res.body).toEqual(tooManyRequests(authMessages.api.resendLimit));

      clock.set(start + HOUR - SECOND);
      expect((await resend()).body).toEqual(tooManyRequests(authMessages.api.resendLimit));
      expect(codesSent()).toHaveLength(5);
    });

    it('allows a code again once the first one is an hour old', async () => {
      clock.set(start + HOUR);
      const res = await resend();
      expect(res.status).toBe(200);
      expect(codesSent()).toHaveLength(6);
    });
  });

  it('counts codes per purpose: a password_reset code does not start the cooldown', async () => {
    await signUp(app, { email: EMAIL });
    clock.advance(MINUTE);
    const user = await models.User.findOne({ where: { email: EMAIL } });
    const codes = createVerificationCodeService({ models, clock, secret: env.VERIFICATION_CODE_SECRET });
    await codes.issue({ userId: user.id, purpose: 'password_reset' });

    const res = await resend();
    expect(res.status).toBe(200);
    expect(codesSent()).toHaveLength(2);
  });

  it('matches the email whatever its case', async () => {
    await signUp(app, { email: EMAIL });
    clock.advance(MINUTE);
    const res = await resend('  SARA@Example.com ');
    expect(res.status).toBe(200);
    expect(codesSent()).toHaveLength(2);
  });

  it('answers an unknown email with the same body and sends nothing', async () => {
    const res = await resend('nobody@example.com');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(SENT);
    expect(mailer.messages).toEqual([]);
    expect(await models.VerificationCode.count()).toBe(0);
  });

  it('answers an already-verified email with the same body and sends nothing', async () => {
    expect((await signUpAndVerify(app, mailer, { email: EMAIL })).status).toBe(200);
    clock.advance(MINUTE);

    const res = await resend();
    expect(res.status).toBe(200);
    expect(res.body).toEqual(SENT);
    expect(codesSent()).toHaveLength(1);
    expect(await models.VerificationCode.count()).toBe(1);
  });

  it('answers as on success when the email cannot be sent, logging only the Account id and purpose (Q-037)', async () => {
    await signUp(app, { email: EMAIL });
    clock.advance(MINUTE);
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => {});
    mailer.failNextSends(1);

    const res = await resend();

    expect(res.status).toBe(200);
    expect(res.body).toEqual(SENT);
    expect(await models.VerificationCode.count()).toBe(2);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(Object.keys(logError.mock.calls[0][0]).sort()).toEqual(['err', 'purpose', 'userId']);
    expect(JSON.stringify(logError.mock.calls[0])).not.toContain(EMAIL);
    logError.mockRestore();
  });
});
