import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  professionalInfoSchema,
  resendCodeSchema,
  resetPasswordSchema,
  selectCountrySchema,
  signUpSchema,
  verifyCodeSchema,
} from '@real-estate/shared';
import { authenticate, authorize } from '../../middlewares/authenticate.js';
import {
  documentUploadRateLimiter,
  loginRateLimiter,
  oneRequestAtATime,
  passwordResetRateLimiter,
  signUpRateLimiter,
} from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';
import { documentUpload, rejectOversizedDocumentsBody } from './documentUpload.js';

// /api/auth routes (SPEC-001). Every public route goes through its group's per-IP limiter first (DEC-039).
export function createAuthRoutes(controller) {
  const router = Router();
  const oneUploadPerAccount = oneRequestAtATime();

  router.post('/sign-up', signUpRateLimiter, validate({ body: signUpSchema }), controller.signUp);
  router.post(
    '/verify-email',
    signUpRateLimiter,
    validate({ body: verifyCodeSchema }),
    controller.verifyEmail,
  );
  router.post(
    '/verify-email/resend',
    signUpRateLimiter,
    validate({ body: resendCodeSchema }),
    controller.resendVerification,
  );
  router.post('/login', loginRateLimiter, validate({ body: loginSchema }), controller.login);
  router.post(
    '/password/forgot',
    passwordResetRateLimiter,
    validate({ body: forgotPasswordSchema }),
    controller.requestPasswordReset,
  );
  router.post(
    '/password/resend',
    passwordResetRateLimiter,
    validate({ body: resendCodeSchema }),
    controller.requestPasswordReset,
  );
  router.post(
    '/password/verify',
    passwordResetRateLimiter,
    validate({ body: verifyCodeSchema }),
    controller.verifyPasswordReset,
  );
  router.post(
    '/password/reset',
    passwordResetRateLimiter,
    validate({ body: resetPasswordSchema }),
    controller.resetPassword,
  );

  // Refresh-cookie routes. Not public, so not behind a per-IP limiter: every page load refreshes (DEC-028).
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
  // Any verified Account without the Developer role; no body. The service checks both against the
  // database, since the token's roles may predate the change.
  router.post('/me/roles/developer', authenticate, controller.becomeDeveloper);
  // Developer onboarding. The Developer role comes from the access token (a Buyer who just became a
  // Developer refreshes first); authorize runs before validate, so a non-Developer gets 403.
  router.put(
    '/me/professional-profile',
    authenticate,
    authorize('developer'),
    validate({ body: professionalInfoSchema }),
    controller.saveProfessionalProfile,
  );
  // Multipart: one file part per kind plus idDocumentType, each file checked with documentUploadSchema
  // and sniffed (documentUpload.js). The body (up to 3 x 10 MB in memory) is parsed last (TASK-053): after
  // the role check, a declared size above the total limit, the Account's budget (10 per hour), one upload
  // at a time per Account, and the eligibility check (403 without Professional info, 409 when nothing can
  // be sent).
  router.post(
    '/me/documents',
    authenticate,
    authorize('developer'),
    rejectOversizedDocumentsBody,
    documentUploadRateLimiter,
    oneUploadPerAccount,
    controller.checkCanSubmitDocuments,
    documentUpload,
    controller.submitDocuments,
  );
  router.get('/me/verification', authenticate, authorize('developer'), controller.getVerification);

  return router;
}
