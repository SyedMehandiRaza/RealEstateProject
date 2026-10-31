import { Router } from 'express';
import {
  createPropertySchema,
  propertyListQuerySchema,
  propertyParamsSchema,
  stagedUploadFieldsSchema,
  toFieldErrors,
} from '@real-estate/shared';
import { authenticate } from '../../middlewares/authenticate.js';
import { propertyUploadRateLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';
import { AppError } from '../../utils/AppError.js';
import { requireActiveDeveloper } from '../auth/index.js';
import { propertyUpload } from './propertyUpload.js';

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
export function createPropertyRoutes({ repository, controller }) {
  const router = Router();
  router.use(authenticate, requireActiveDeveloper);
  router.param('id', ownedPropertyParam(repository));

  router.get('/', validate({ query: propertyListQuerySchema }), controller.listProperties);
  router.post('/', validate({ body: createPropertySchema }), controller.createProperty);
  router.post(
    '/uploads',
    propertyUploadRateLimiter,
    propertyUpload({ fieldsSchema: stagedUploadFieldsSchema, purposeOf: (fields) => fields.purpose }),
    controller.stageUpload,
  );
  router.get('/:id', controller.getProperty);
  return router;
}
