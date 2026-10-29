import crypto from 'node:crypto';
import { authMessages, LIMITS } from '@real-estate/shared';
import { Op } from 'sequelize';
import { AppError } from '../../utils/AppError.js';
import { constantTimeEqual } from '../../utils/constantTimeEqual.js';
import { toWholeSeconds } from '../../utils/time.js';

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

// Reset guessing cap (Q-044, DEC-041), password_reset only: once 3 dead codes (MAX_ATTEMPTS wrong
// guesses each) were created within 24 h of each other, no new reset code until 24 h after the newest of
// them was created. A code can only be guessed in its 10 minutes, so it dies within 10 min of created_at.
export const DEAD_RESET_CODES_CAP = 3;
export const RESET_PAUSE_MS = 24 * HOUR_MS;

// Thrown by issue() when the resend rules refuse a new code: 429 TOO_MANY_REQUESTS with resendTooSoon(n),
// resendLimit or resetCodesPaused. Nothing was written, so the caller's transaction is unharmed; a
// caller that sends a code only if the rules allow (log in of an unverified Account, TASK-021) catches
// this class.
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
  return constantTimeEqual(Buffer.from(storedHash, 'hex'), expected);
}

export function createVerificationCodeService({ models, clock, secret, random = crypto.randomInt }) {
  const { VerificationCode } = models;

  // True while the reset guessing cap is in force: some DEAD_RESET_CODES_CAP consecutive dead
  // password_reset codes span less than 24 h and the newest of them is less than 24 h old. Only codes
  // created in the last 48 h can matter. Wrong guesses below MAX_ATTEMPTS do not count.
  async function resetCodesPaused({ userId, now, transaction }) {
    const dead = await VerificationCode.findAll({
      attributes: ['createdAt'],
      where: {
        userId,
        purpose: CODE_PURPOSES.passwordReset,
        attempts: { [Op.gte]: MAX_ATTEMPTS },
        createdAt: { [Op.gt]: new Date(now.getTime() - 2 * RESET_PAUSE_MS) },
      },
      order: [
        ['createdAt', 'ASC'],
        ['id', 'ASC'],
      ],
      transaction,
    });
    return dead.some((code, i) => {
      if (i < DEAD_RESET_CODES_CAP - 1) return false;
      const newest = code.createdAt.getTime();
      const oldest = dead[i - DEAD_RESET_CODES_CAP + 1].createdAt.getTime();
      return newest - oldest < RESET_PAUSE_MS && now.getTime() < newest + RESET_PAUSE_MS;
    });
  }

  return {
    // Stores a new code for the Account and purpose and returns it in clear for the mailer only. Applies
    // the resend rules first and throws ResendRefusedError when they refuse; the hourly cap is checked
    // first, so a capped Account is not told to wait a few seconds for nothing. A new code cancels the
    // older ones because check() only looks at the newest. Pass the caller's transaction so the code is
    // created or rolled back with the rest of the change; to serialize concurrent requests for one
    // Account, the caller locks the Account row in that transaction first.
    async issue({ userId, purpose }, { transaction } = {}) {
      const now = toWholeSeconds(clock.now());
      // The longest refusal first, as for the hourly cap below.
      if (purpose === CODE_PURPOSES.passwordReset && (await resetCodesPaused({ userId, now, transaction }))) {
        throw new ResendRefusedError(authMessages.api.resetCodesPaused);
      }
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
