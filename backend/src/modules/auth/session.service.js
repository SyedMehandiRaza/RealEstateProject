import { Op } from 'sequelize';
import { AppError } from '../../utils/AppError.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';

// What `consume` found for a presented refresh token.
export const SESSION_CHECK = Object.freeze({
  valid: 'valid',
  // Missing, not a signed refresh token, never issued, or expired.
  invalid: 'invalid',
  // Already revoked (rotated or logged out): every session of the Account has now been revoked.
  reused: 'reused',
});

// Login sessions: an access token for the JSON body and a refresh token for the httpOnly cookie. Only the
// refresh token's hash is stored. Each refresh rotates the token (DEC-008, DEC-028).
export function createSessionService({ models, clock }) {
  const { RefreshToken } = models;

  // cookie-parser turns a `j:` cookie into an object, so anything but a non-empty string is no token.
  const isToken = (token) => typeof token === 'string' && token.length > 0;

  // Revokes every active token of the Account.
  const revokeAll = (userId, { transaction } = {}) =>
    RefreshToken.update(
      { revokedAt: clock.now() },
      { where: { userId, revokedAt: { [Op.is]: null } }, transaction },
    );

  return {
    // `roles` are the role names the access token carries.
    async start({ userId, roles }, { transaction } = {}) {
      const refresh = signRefreshToken({ userId });
      await RefreshToken.create(
        { userId, jti: refresh.jti, tokenHash: hashToken(refresh.token), expiresAt: refresh.expiresAt },
        { transaction },
      );
      return {
        accessToken: signAccessToken({ userId, roles }),
        refreshToken: { token: refresh.token, expiresAt: refresh.expiresAt },
      };
    },

    // The first half of a rotation, inside the caller's transaction: checks the presented token and, if
    // it is valid, revokes it and returns its Account id (the caller then starts the next session). A
    // token that was already revoked is a reuse: every token of its Account is revoked, so the caller
    // must commit before refusing. The row is locked, so two refreshes with one token run in turn and
    // the second one is a reuse.
    async consume(token, { transaction }) {
      if (!isToken(token)) return { result: SESSION_CHECK.invalid };

      let payload;
      try {
        payload = verifyRefreshToken(token, { now: clock.now() });
      } catch (error) {
        if (error instanceof AppError) return { result: SESSION_CHECK.invalid };
        throw error;
      }

      const row = await RefreshToken.findOne({
        where: { tokenHash: hashToken(token) },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row || String(row.userId) !== payload.sub || row.jti !== payload.jti) {
        return { result: SESSION_CHECK.invalid };
      }
      if (row.revokedAt) {
        await revokeAll(row.userId, { transaction });
        return { result: SESSION_CHECK.reused };
      }
      if (row.expiresAt <= clock.now()) return { result: SESSION_CHECK.invalid };

      await row.update({ revokedAt: clock.now() }, { transaction });
      return { result: SESSION_CHECK.valid, userId: row.userId };
    },

    // Logout: revokes the presented token if it is a known active one. Anything else is ignored, and a
    // revoked token does not count as a reuse here (Q-038).
    async end(token) {
      if (!isToken(token)) return;
      await RefreshToken.update(
        { revokedAt: clock.now() },
        { where: { tokenHash: hashToken(token), revokedAt: { [Op.is]: null } } },
      );
    },

    revokeAll,
  };
}
