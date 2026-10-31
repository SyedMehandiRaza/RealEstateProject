import models, { sequelize } from '../../models/index.js';
import { requireActiveDeveloper } from '../auth/index.js';
import { createStaffController } from './staff.controller.js';
import { createStaffRepository } from './staff.repository.js';
import { createStaffRoutes } from './staff.routes.js';
import { createStaffService } from './staff.service.js';

// Wires the staff module to the database. Mounted at /api/staff.
export function createStaffRouter() {
  const service = createStaffService({ sequelize, repository: createStaffRepository(models) });
  return createStaffRoutes(createStaffController(service), { requireActiveDeveloper });
}
