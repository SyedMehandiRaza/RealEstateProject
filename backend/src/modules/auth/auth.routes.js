import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  resendCodeSchema,
  resetPasswordSchema,
  selectCountrySchema,
  signUpSchema,
  verifyCodeSchema,
} from '@real-estate/shared';
import { authenticate, authorize } from '../../middlewares/authenticate.js';
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
  router.post(
    '/password/forgot',
    authRateLimiter,
    validate({ body: forgotPasswordSchema }),
    controller.requestPasswordReset,
  );
  router.post(
    '/password/resend',
    authRateLimiter,
    validate({ body: resendCodeSchema }),
    controller.requestPasswordReset,
  );
  router.post(
    '/password/verify',
    authRateLimiter,
    validate({ body: verifyCodeSchema }),
    controller.verifyPasswordReset,
  );
  router.post(
    '/password/reset',
    authRateLimiter,
    validate({ body: resetPasswordSchema }),
    controller.resetPassword,
  );

  // Refresh-cookie routes. Not public, so not behind the per-IP limiter, which every page load's refresh
  // would otherwise share with sign-up and login (DEC-028).
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);

  // Signed-in routes: the access token identifies the Account.
  router.get('/me', authenticate, controller.me);
  // Roles come from the access token; they are only ever added, so a Buyer token's role still holds.
  // authorize runs before validate: a non-Buyer gets 403 whatever it sends.
  router.put(
    '/me/country',
    authenticate,
    authorize('buyer'),
    validate({ body: selectCountrySchema }),
    controller.selectCountry,
  );

  return router;
}
