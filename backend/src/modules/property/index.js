import models from '../../models/index.js';
import { createPropertyRepository } from './property.repository.js';
import { createPropertyRoutes } from './property.routes.js';

// Wires the property module to the database and to createApp's external dependencies (storage, clock).
export function createPropertyRouter() {
  return createPropertyRoutes({ repository: createPropertyRepository(models) });
}
