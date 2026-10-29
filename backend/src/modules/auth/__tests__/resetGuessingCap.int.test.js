import request from 'supertest';
import { authMessages, commonMessages } from '@real-estate/shared';
import { resetRateLimiters } from '../../../middlewares/rateLimiter.js';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import {
  forgotPassword,
  resendPasswordReset,
  resendVerification,
  signUp,
  signUpAndVerify,
  VERIFY_EMAIL,
  verifyPasswordReset,
} from '../../../test/authFlows.js';
import { MAX_ATTEMPTS } from '../verificationCode.service.js';

// TASK-054 (Q-044, DEC-041): after 3 dead password_reset codes (MAX_ATTEMPTS wrong guesses each) created
// within 24 h, forgot/resend password refuse a new code with 429 resetCodesPaused until 24 h after the
// newest of them was created. Email verification codes and other Accounts are not affected.

const EMAIL = 'sara@example.com';
const OTHER = 'omar@example.com';
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const RESET = 'password_reset';
const VERIFICATION = 'email_verification';

const SENT = { success: true, data: { sent: true } };
const paused = {
  success: false,
  error: { code: 'TOO_MANY_REQUESTS', message: authMessages.api.resetCodesPaused },
};
const codeError = (message) => ({
  success: false,
  error: { code: 'VALIDATION_ERROR', message: commonMessages.invalidInput, fields: { code: [message] } },
});
const wrongCodeFor = (code) => (code === '000000' ? '000001' : '000000');
const wholeSecond = () => Math.floor(Date.now() / SECOND) * SECOND;

describe('password reset guessing cap', () => {
  let app;
  let mailer;
  let clock;
  let start;
  const resetCodesSent = (email = EMAIL) =>
    mailer.messages.filter((m) => m.to === email && m.purpose === RESET);
  const forgot = (email = EMAIL) => forgotPassword(app, email);
  const resend = (email = EMAIL) => resendPasswordReset(app, email);

  // Sends `guesses` wrong guesses at the newest code of `purpose` (all MAX_ATTEMPTS by default: the code
  // dies). The per-IP limiters are reset afterwards: they are not what these tests check.
  async function guessWrong({ email = EMAIL, purpose = RESET, guesses = MAX_ATTEMPTS } = {}) {
    const wrong = wrongCodeFor(mailer.lastCodeFor(email, purpose));
    let res;
    for (let guess = 1; guess <= guesses; guess += 1) {
      res =
        purpose === RESET
          ? await verifyPasswordReset(app, { email, code: wrong })
          : await request(app).post(VERIFY_EMAIL).send({ email, code: wrong });
    }
    const expected =
      guesses >= MAX_ATTEMPTS ? authMessages.api.codeTooManyAttempts : authMessages.api.codeInvalid;
    expect(res.body).toEqual(codeError(expected));
    await resetRateLimiters();
  }

  // Requests a reset code at `atMs` (from forgot) and kills it with wrong guesses.
  async function deadResetCode(atMs, email = EMAIL) {
    clock.set(atMs);
    expect((await forgot(email)).body).toEqual(SENT);
    await guessWrong({ email });
  }

  beforeEach(async () => {
    ({ app, mailer, clock } = createTestApp());
    start = wholeSecond();
    clock.set(start);
    await signUpAndVerify(app, mailer, { email: EMAIL });
  });

  describe('after 3 dead codes a minute apart', () => {
    let third;

    beforeEach(async () => {
      await deadResetCode(start);
      await deadResetCode(start + MINUTE);
      third = start + 2 * MINUTE;
      await deadResetCode(third);
      expect(resetCodesSent()).toHaveLength(3);
    });

    it('refuses the 4th request from forgot and from resend with 429 resetCodesPaused, sending nothing', async () => {
      clock.set(third + MINUTE);
      const res = await forgot();
      expect(res.status).toBe(429);
      expect(res.body).toEqual(paused);
      expect((await resend()).body).toEqual(paused);
      expect(resetCodesSent()).toHaveLength(3);
      expect(await models.VerificationCode.count({ where: { purpose: RESET } })).toBe(3);
    });

    it('still refuses at 23:59 after the newest dead code', async () => {
      clock.set(third + DAY - MINUTE);
      expect((await forgot()).body).toEqual(paused);
      clock.set(third + DAY - SECOND);
      expect((await resend()).body).toEqual(paused);
      expect(resetCodesSent()).toHaveLength(3);
    });

    it('sends a code again at 24:00, and that code works', async () => {
      clock.set(third + DAY);
      expect((await forgot()).body).toEqual(SENT);
      expect(resetCodesSent()).toHaveLength(4);
      const res = await verifyPasswordReset(app, { email: EMAIL, code: mailer.lastCodeFor(EMAIL, RESET) });
      expect(res.status).toBe(200);
    });

    it('answers an unknown email with { sent: true } as before', async () => {
      clock.set(third + MINUTE);
      expect((await forgot('nobody@example.com')).body).toEqual(SENT);
    });

    it('does not affect email verification codes of the same Account', async () => {
      await models.User.update({ emailVerifiedAt: null }, { where: { email: EMAIL } });
      clock.set(third + MINUTE);
      const res = await resendVerification(app, EMAIL);
      expect(res.body).toEqual(SENT);
      expect(mailer.messages.filter((m) => m.to === EMAIL && m.purpose === VERIFICATION)).toHaveLength(2);
    });

    it('does not affect another Account', async () => {
      await signUpAndVerify(app, mailer, { email: OTHER });
      clock.set(third + MINUTE);
      expect((await forgot(OTHER)).body).toEqual(SENT);
      expect(resetCodesSent(OTHER)).toHaveLength(1);
    });
  });

  it('pauses for 24 h after the 3rd dead code even when the three span most of a day', async () => {
    await deadResetCode(start);
    await deadResetCode(start + 12 * HOUR);
    const third = start + 23 * HOUR;
    await deadResetCode(third);

    clock.set(third + DAY - SECOND);
    expect((await forgot()).body).toEqual(paused);
    clock.set(third + DAY);
    expect((await forgot()).body).toEqual(SENT);
  });

  it('does not pause when the 3 dead codes span 24 h or more', async () => {
    await deadResetCode(start);
    await deadResetCode(start + 12 * HOUR);
    await deadResetCode(start + DAY);

    clock.set(start + DAY + MINUTE);
    expect((await forgot()).body).toEqual(SENT);
  });

  it('does not count wrong guesses below the limit', async () => {
    for (let i = 0; i < 3; i += 1) {
      clock.set(start + i * MINUTE);
      expect((await forgot()).body).toEqual(SENT);
      await guessWrong({ guesses: MAX_ATTEMPTS - 1 });
    }
    // A 4th code with 4 wrong guesses and a 5th: the hourly cap (5) is not reached either.
    clock.set(start + 3 * MINUTE);
    expect((await forgot()).body).toEqual(SENT);
    await guessWrong({ guesses: MAX_ATTEMPTS - 1 });
    clock.set(start + 4 * MINUTE);
    expect((await resend()).body).toEqual(SENT);
    expect(resetCodesSent()).toHaveLength(5);
  });

  it('does not count dead email verification codes', async () => {
    await signUp(app, { email: OTHER });
    for (let i = 0; i < 3; i += 1) {
      if (i > 0) {
        clock.set(start + i * MINUTE);
        expect((await resendVerification(app, OTHER)).body).toEqual(SENT);
      }
      await guessWrong({ email: OTHER, purpose: VERIFICATION });
    }

    clock.set(start + 3 * MINUTE);
    expect((await forgot(OTHER)).body).toEqual(SENT);
    expect(resetCodesSent(OTHER)).toHaveLength(1);
  });

  it('counts only codes of the Account: 2 dead codes each for two Accounts pause neither', async () => {
    await signUpAndVerify(app, mailer, { email: OTHER });
    await deadResetCode(start, EMAIL);
    await deadResetCode(start, OTHER);
    await deadResetCode(start + MINUTE, EMAIL);
    await deadResetCode(start + MINUTE, OTHER);

    clock.set(start + 2 * MINUTE);
    expect((await forgot(EMAIL)).body).toEqual(SENT);
    expect((await forgot(OTHER)).body).toEqual(SENT);
  });
});
