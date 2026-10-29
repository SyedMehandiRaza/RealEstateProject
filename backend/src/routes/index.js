import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes.js';

// Mount each module router here (one line per module), e.g. apiRouter.use('/auth', authRouter);
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
