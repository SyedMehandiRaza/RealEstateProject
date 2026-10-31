import { Router } from 'express';
import { createAuthRouter } from '../modules/auth/index.js';
import { healthRouter } from '../modules/health/health.routes.js';
import { createStaffRouter } from '../modules/staff/index.js';

// Builds the /api router. Mount each module router here (one line per module). A module that needs an
// external dependency builds its router from createApp's dependencies { mailer, storage, clock }.
export function createApiRouter(dependencies) {
  const router = Router();
  router.use('/health', healthRouter);
  router.use('/auth', createAuthRouter(dependencies));
  router.use('/staff', createStaffRouter());
  return router;
}
