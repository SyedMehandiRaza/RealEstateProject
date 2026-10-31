import { Router } from 'express';
import { propertyParamsSchema, toFieldErrors } from '@real-estate/shared';
import { authenticate } from '../../middlewares/authenticate.js';
import { AppError } from '../../utils/AppError.js';
import { requireActiveDeveloper } from '../auth/index.js';

// Loads the property of a route's :id into req.property, only when the caller owns it (PROP-DEC-011):
// another Developer's property and a missing one both answer 404, so ids reveal nothing. Runs before the
// route's own handlers, so a multipart body is never read for a refused request.
function ownedPropertyParam(repository) {
  return async (req, _res, next, value) => {
    try {
      const parsed = propertyParamsSchema.safeParse({ id: value });
      if (!parsed.success) throw new AppError('VALIDATION_ERROR', { fields: toFieldErrors(parsed.error) });
      const property = await repository.findOwned(parsed.data.id, req.user.id);
      if (!property) throw new AppError('NOT_FOUND');
      req.property = property;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// /api/properties (PROP-SPEC-001). Every route needs an Active Developer: authenticate → 401,
// requireActiveDeveloper → 403 FORBIDDEN / DEVELOPER_NOT_ACTIVE; then validate → controller.
export function createPropertyRoutes({ repository }) {
  const router = Router();
  router.use(authenticate, requireActiveDeveloper);
  router.param('id', ownedPropertyParam(repository));
  return router;
}
