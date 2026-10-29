import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes.js';

// Builds the /api router. Mount each module router here (one line per module). A module that needs an
// external dependency builds its router from createApp's dependencies { mailer, storage, clock }, e.g.
// router.use('/auth', createAuthRouter(dependencies)). Rename the parameter to `dependencies` when the
// first module uses it.
export function createApiRouter(_dependencies) {
  const router = Router();
  router.use('/health', healthRouter);
  return router;
}
