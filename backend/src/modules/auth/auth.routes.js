import { Router } from 'express';
import { resendCodeSchema, signUpSchema, verifyCodeSchema } from '@real-estate/shared';
import { authRateLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';

// /api/auth routes (SPEC-001). Every public route goes through the per-IP limiter first.
export function createAuthRoutes(controller) {
  const router = Router();

  router.post('/sign-up', authRateLimiter, validate({ body: signUpSchema }), controller.signUp);
  router.post('/verify-email', authRateLimiter, validate({ body: verifyCodeSchema }), controller.verifyEmail);
  router.post(
    '/verify-email/resend',
    authRateLimiter,
    validate({ body: resendCodeSchema }),
    controller.resendVerification,
  );

  return router;
}
