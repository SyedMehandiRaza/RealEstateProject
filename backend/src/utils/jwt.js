import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

const ALGORITHM = 'HS256';

// The `typ` claim each kind of token carries and is checked for (TASK-053, DEC-040), so a token of one
// kind is never accepted as the other, even if both were signed with one secret.
export const TOKEN_TYPES = Object.freeze({ access: 'access', refresh: 'refresh' });

// Short-lived token sent as `Authorization: Bearer <token>`; kept in memory on the client.
// `roles` is a list: one account can be both buyer and developer (Q-031).
export function signAccessToken({ userId, roles }) {
  return jwt.sign({ typ: TOKEN_TYPES.access, roles }, env.JWT_ACCESS_SECRET, {
    subject: String(userId),
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    algorithm: ALGORITHM,
  });
}

// Long-lived token sent only as an httpOnly cookie. `jti` identifies the stored (hashed) token for rotation/revocation.
export function signRefreshToken({ userId }) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ typ: TOKEN_TYPES.refresh }, env.JWT_REFRESH_SECRET, {
    subject: String(userId),
    jwtid: jti,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    algorithm: ALGORITHM,
  });
  return { token, jti, expiresAt: new Date(jwt.decode(token).exp * 1000) };
}

// `now` (a Date, default the current time) is the time the expiry is checked against, so services can
// pass their injected clock. `acceptsType(typ)` says whether the token's typ claim is the expected one.
function verify(token, secret, acceptsType, { now } = {}) {
  const clockTimestamp = now ? Math.floor(now.getTime() / 1000) : undefined;
  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: [ALGORITHM], clockTimestamp });
  } catch (error) {
    throw new AppError(error instanceof jwt.TokenExpiredError ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED');
  }
  if (!acceptsType(payload.typ)) throw new AppError('UNAUTHORIZED');
  return payload;
}

// An access token must say typ "access": one issued before TASK-053 has none and is refused, which only
// costs a silent refresh (they live 15 minutes).
export const verifyAccessToken = (token) =>
  verify(token, env.JWT_ACCESS_SECRET, (typ) => typ === TOKEN_TYPES.access);
// A refresh token with another typ is refused. One without typ (issued before TASK-053, up to 7 days) is
// still accepted: the hashed lookup in refresh_tokens already ties it to a session (DEC-040).
export const verifyRefreshToken = (token, options) =>
  verify(token, env.JWT_REFRESH_SECRET, (typ) => typ === undefined || typ === TOKEN_TYPES.refresh, options);

// Store only this hash of a refresh token in the database, never the token itself.
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
