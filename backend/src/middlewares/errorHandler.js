import { ERROR_CODES } from '@real-estate/shared';
import { UniqueConstraintError } from 'sequelize';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

function toAppError(err) {
  if (err instanceof AppError) return err;
  if (err?.type === 'entity.parse.failed' || err?.type === 'entity.too.large')
    return new AppError('BAD_REQUEST');
  // Services should map known unique fields to a shared field message; this is the fallback.
  if (err instanceof UniqueConstraintError) return new AppError('CONFLICT');
  return null;
}

// Formats every error as { success: false, error: { code, message, fields? } }. Never leaks stacks or raw messages.
export function errorHandler(err, req, res, _next) {
  const appError = toAppError(err);

  if (!appError) {
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
    const { status, message } = ERROR_CODES.INTERNAL_ERROR;
    return res.status(status).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
  }

  const error = { code: appError.code, message: appError.message };
  if (appError.fields) error.fields = appError.fields;
  return res.status(appError.status).json({ success: false, error });
}
