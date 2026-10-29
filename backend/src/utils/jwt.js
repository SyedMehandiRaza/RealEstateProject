import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

const ALGORITHM = 'HS256';

// Short-lived token sent as `Authorization: Bearer <token>`; kept in memory on the client.
// `roles` is a list: one account can be both buyer and developer (Q-031).
export function signAccessToken({ userId, roles }) {
  return jwt.sign({ roles }, env.JWT_ACCESS_SECRET, {
    subject: String(userId),
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    algorithm: ALGORITHM,
  });
}

// Long-lived token sent only as an httpOnly cookie. `jti` identifies the stored (hashed) token for rotation/revocation.
export function signRefreshToken({ userId }) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({}, env.JWT_REFRESH_SECRET, {
    subject: String(userId),
    jwtid: jti,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    algorithm: ALGORITHM,
  });
  return { token, jti, expiresAt: new Date(jwt.decode(token).exp * 1000) };
}

// `now` (a Date, default the current time) is the time the expiry is checked against, so services can
// pass their injected clock.
function verify(token, secret, { now } = {}) {
  const clockTimestamp = now ? Math.floor(now.getTime() / 1000) : undefined;
  try {
    return jwt.verify(token, secret, { algorithms: [ALGORITHM], clockTimestamp });
  } catch (error) {
    throw new AppError(error instanceof jwt.TokenExpiredError ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED');
  }
}

export const verifyAccessToken = (token) => verify(token, env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token, options) => verify(token, env.JWT_REFRESH_SECRET, options);

// Store only this hash of a refresh token in the database, never the token itself.
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
