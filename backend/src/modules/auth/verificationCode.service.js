import crypto from 'node:crypto';
import { authMessages, LIMITS } from '@real-estate/shared';
import { Op } from 'sequelize';
import { AppError } from '../../utils/AppError.js';

// Verification codes (SPEC-001, DEC-015, DEC-021, DEC-026): issues and checks the 6-digit codes emailed
// for a purpose. Codes come from a cryptographic random source, keep their leading zeros and are stored only
// as HMAC-SHA256 with VERIFICATION_CODE_SECRET. Only the newest code of an Account and purpose can be
// accepted, so issuing a new code cancels the older ones.

export const CODE_PURPOSES = Object.freeze({
  emailVerification: 'email_verification',
  passwordReset: 'password_reset',
});

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

// Resend rules (DEC-021), per Account and purpose: a new code at most every 60 s and at most 5 codes in
// any rolling hour. The first code (sign-up, forgot password) counts too.
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_CODES_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

// Thrown by issue() when the resend rules refuse a new code: 429 TOO_MANY_REQUESTS with resendTooSoon(n)
// or resendLimit. Nothing was written, so the caller's transaction is unharmed; a caller that sends a
// code only if the rules allow (log in of an unverified Account, TASK-021) catches this class.
export class ResendRefusedError extends AppError {
  constructor(message) {
    super('TOO_MANY_REQUESTS', { message });
    this.name = 'ResendRefusedError';
  }
}

// What check() found. The caller turns anything but `valid` into its error response.
export const CODE_CHECK = Object.freeze({
  valid: 'valid',
  invalid: 'invalid', // wrong, expired, already used, not the newest, or no code at all
  tooManyAttempts: 'tooManyAttempts', // the code took MAX_ATTEMPTS wrong guesses and is dead
});

const CODE_SPACE = 10 ** LIMITS.auth.codeLength;

export function generateCode(randomInt = crypto.randomInt) {
  return String(randomInt(0, CODE_SPACE)).padStart(LIMITS.auth.codeLength, '0');
}

export const hashCode = (code, secret) => crypto.createHmac('sha256', secret).update(code).digest('hex');

// Constant-time comparison of a submitted code with the stored HMAC.
export function isSameCode(code, storedHash, secret) {
  const expected = Buffer.from(hashCode(code, secret), 'hex');
  const actual = Buffer.from(storedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// DATETIME columns keep whole seconds. Working in whole seconds here means the stored times are exactly
// the ones computed, so a code dies at exactly 10:00 however the driver treats a fraction.
const toWholeSeconds = (date) => new Date(Math.floor(date.getTime() / 1000) * 1000);

export function createVerificationCodeService({ models, clock, secret, random = crypto.randomInt }) {
  const { VerificationCode } = models;

  return {
    // Stores a new code for the Account and purpose and returns it in clear for the mailer only. Applies
    // the resend rules first and throws ResendRefusedError when they refuse; the hourly cap is checked
    // first, so a capped Account is not told to wait a few seconds for nothing. A new code cancels the
    // older ones because check() only looks at the newest. Pass the caller's transaction so the code is
    // created or rolled back with the rest of the change; to serialize concurrent requests for one
    // Account, the caller locks the Account row in that transaction first.
    async issue({ userId, purpose }, { transaction } = {}) {
      const now = toWholeSeconds(clock.now());
      const recent = await VerificationCode.findAll({
        attributes: ['createdAt'],
        where: { userId, purpose, createdAt: { [Op.gt]: new Date(now.getTime() - HOUR_MS) } },
        order: [
          ['createdAt', 'DESC'],
          ['id', 'DESC'],
        ],
        transaction,
      });
      if (recent.length >= MAX_CODES_PER_HOUR) throw new ResendRefusedError(authMessages.api.resendLimit);
      if (recent.length > 0) {
        const waitMs = recent[0].createdAt.getTime() + RESEND_COOLDOWN_MS - now.getTime();
        if (waitMs > 0)
          throw new ResendRefusedError(authMessages.api.resendTooSoon(Math.ceil(waitMs / 1000)));
      }

      const code = generateCode(random);
      await VerificationCode.create(
        {
          userId,
          purpose,
          codeHash: hashCode(code, secret),
          expiresAt: new Date(now.getTime() + CODE_TTL_MS),
          // Set from the injected clock: "newest" and the expiry CHECK both compare with created_at.
          createdAt: now,
        },
        { transaction },
      );
      return code;
    },

    // Checks a code against the newest one of the Account and purpose. A wrong guess is recorded, so the
    // caller must commit the transaction even when the answer is not `valid`. An accepted code is marked
    // used and never works again.
    async check({ userId, purpose, code }, { transaction }) {
      const newest = await VerificationCode.findOne({
        where: { userId, purpose },
        order: [
          ['createdAt', 'DESC'],
          ['id', 'DESC'],
        ],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!newest || newest.usedAt) return CODE_CHECK.invalid;
      if (newest.attempts >= MAX_ATTEMPTS) return CODE_CHECK.tooManyAttempts;
      const now = clock.now();
      if (now >= newest.expiresAt) return CODE_CHECK.invalid;

      if (!isSameCode(code, newest.codeHash, secret)) {
        // The row is locked FOR UPDATE, so concurrent guesses are counted one after the other.
        const attempts = newest.attempts + 1;
        await newest.update({ attempts }, { transaction });
        return attempts >= MAX_ATTEMPTS ? CODE_CHECK.tooManyAttempts : CODE_CHECK.invalid;
      }

      await newest.update({ usedAt: now }, { transaction });
      return CODE_CHECK.valid;
    },
  };
}
