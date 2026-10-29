import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

// Reset permission (SPEC-001, DEC-029): returned when a password_reset code is accepted and presented to
// POST /password/reset (TASK-024). A JWT with purpose `password_reset`, subject the Account and 10 minutes
// of life. It carries an HMAC fingerprint of the Account's password hash at issue time, so it stops
// working the moment the password changes: single-use with no schema change. The hash itself never
// leaves the server (a JWT payload is readable by anyone holding it).
//
// Its keys are derived from a parent secret with HKDF, so no new env var is needed and a reset token
// can never pass as an access token (or the other way round): they are signed with different keys.

export const RESET_TOKEN_PURPOSE = 'password_reset';
export const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const ALGORITHM = 'HS256';
const KEY_LENGTH = 32;

const deriveKey = (parentSecret, info) =>
  Buffer.from(crypto.hkdfSync('sha256', parentSecret, '', info, KEY_LENGTH));

const toSeconds = (date) => Math.floor(date.getTime() / 1000);

export function createResetTokens({ parentSecret, clock }) {
  const signingKey = deriveKey(parentSecret, 'real-estate/password-reset-token/signing/v1');
  const fingerprintKey = deriveKey(parentSecret, 'real-estate/password-reset-token/fingerprint/v1');
  const fingerprintOf = (passwordHash) =>
    crypto.createHmac('sha256', fingerprintKey).update(passwordHash).digest('base64url');

  return {
    // A signed reset token for the Account, bound to its current password hash.
    issue({ userId, passwordHash }) {
      return jwt.sign(
        { purpose: RESET_TOKEN_PURPOSE, pwd: fingerprintOf(passwordHash), iat: toSeconds(clock.now()) },
        signingKey,
        { subject: String(userId), expiresIn: RESET_TOKEN_TTL_MS / 1000, algorithm: ALGORITHM },
      );
    },

    // `{ userId, fingerprint }` for a token this module signed that has not expired by the injected
    // clock, otherwise null. Whether it still matches the password is matchesPassword's job.
    read(token) {
      if (typeof token !== 'string' || token === '') return null;
      let payload;
      try {
        payload = jwt.verify(token, signingKey, {
          algorithms: [ALGORITHM],
          clockTimestamp: toSeconds(clock.now()),
        });
      } catch {
        return null;
      }
      const userId = Number(payload.sub);
      if (payload.purpose !== RESET_TOKEN_PURPOSE || !Number.isSafeInteger(userId) || userId <= 0)
        return null;
      if (typeof payload.pwd !== 'string') return null;
      return { userId, fingerprint: payload.pwd };
    },

    // True while the Account's password hash is the one the token was issued for (constant time).
    matchesPassword({ fingerprint }, passwordHash) {
      const expected = Buffer.from(fingerprintOf(passwordHash));
      const actual = Buffer.from(fingerprint);
      return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
    },
  };
}
