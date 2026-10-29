import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

// Requires `Authorization: Bearer <access token>`; sets req.user = { id, roles }.
export function authenticate(req, _res, next) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('UNAUTHORIZED'));
  }
  const payload = verifyAccessToken(token);
  req.user = { id: Number(payload.sub), roles: Array.isArray(payload.roles) ? payload.roles : [] };
  next();
}

// Use after authenticate: authorize('admin', 'developer') allows a user holding any of those roles.
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError('UNAUTHORIZED'));
    if (!roles.some((role) => req.user.roles.includes(role))) return next(new AppError('FORBIDDEN'));
    next();
  };
