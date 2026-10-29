import { Router } from 'express';
import { loginSchema, resendCodeSchema, signUpSchema, verifyCodeSchema } from '@real-estate/shared';
import { authenticate } from '../../middlewares/authenticate.js';
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
  router.post('/login', authRateLimiter, validate({ body: loginSchema }), controller.login);

  // Signed-in routes: the access token identifies the Account.
  router.get('/me', authenticate, controller.me);

  return router;
}
