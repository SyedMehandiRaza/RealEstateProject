import { env } from '../../config/env.js';
import models from '../../models/index.js';
import { createPropertyController } from './property.controller.js';
import { createPropertyRepository } from './property.repository.js';
import { createPropertyRoutes } from './property.routes.js';
import { createPropertyService } from './property.service.js';
import { createUploadTokens } from './uploadToken.js';

// Wires the property module to the database and to createApp's external dependencies (storage, clock).
export function createPropertyRouter({ storage, clock }) {
  const repository = createPropertyRepository(models);
  const service = createPropertyService({
    storage,
    // Key derived from the access secret, never equal to it (DEC-029, PROP-DEC-012).
    uploadTokens: createUploadTokens({ parentSecret: env.JWT_ACCESS_SECRET, clock }),
  });
  return createPropertyRoutes({ repository, controller: createPropertyController(service) });
}
