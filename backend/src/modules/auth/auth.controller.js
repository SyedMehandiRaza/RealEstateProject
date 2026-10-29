import { clearRefreshCookieOptions, REFRESH_COOKIE_NAME, refreshCookieOptions } from '../../utils/cookies.js';
import { sendSuccess } from '../../utils/response.js';

// HTTP only: read the validated input, call the service, send the response. The refresh token is only
// ever sent as the httpOnly cookie, never in the body.
export function createAuthController(authService, onboardingService) {
  const startSession = (res, { accessToken, refreshToken, user }) => {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken.token, refreshCookieOptions(refreshToken.expiresAt));
    return sendSuccess(res, { accessToken, user });
  };
  const clearSession = (res) => res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
  const refreshTokenOf = (req) => req.cookies?.[REFRESH_COOKIE_NAME];

  return {
    async signUp(req, res) {
      sendSuccess(res, await authService.signUp(req.validated.body), { status: 201 });
    },

    async verifyEmail(req, res) {
      startSession(res, await authService.verifyEmail(req.validated.body));
    },

    async resendVerification(req, res) {
      sendSuccess(res, await authService.resendVerification(req.validated.body));
    },

    // Forgot Password and its Resend share one use case (SPEC-001: same rules, same answer).
    async requestPasswordReset(req, res) {
      sendSuccess(res, await authService.requestPasswordReset(req.validated.body));
    },

    async verifyPasswordReset(req, res) {
      sendSuccess(res, await authService.verifyPasswordReset(req.validated.body));
    },

    // No session starts: the client goes to Log in with the returned message.
    async resetPassword(req, res) {
      sendSuccess(res, await authService.resetPassword(req.validated.body));
    },

    async login(req, res) {
      startSession(res, await authService.login(req.validated.body));
    },

    // A refused refresh also clears the cookie, so the browser stops sending a dead token, except for a
    // token revoked inside the grace window (keepsCookie): a concurrent tab may just have rotated it, and
    // clearing would delete the new cookie (TASK-053). Other errors (such as the database being down) keep
    // it, so the session can resume.
    async refresh(req, res) {
      try {
        startSession(res, await authService.refresh({ refreshToken: refreshTokenOf(req) }));
      } catch (error) {
        if (error?.code === 'UNAUTHORIZED' && !error.keepsCookie) clearSession(res);
        throw error;
      }
    },

    async logout(req, res) {
      await authService.logout({ refreshToken: refreshTokenOf(req) });
      clearSession(res);
      res.status(204).end();
    },

    async me(req, res) {
      sendSuccess(res, await authService.me({ userId: req.user.id }));
    },

    async becomeDeveloper(req, res) {
      sendSuccess(res, await authService.becomeDeveloper({ userId: req.user.id }), { status: 201 });
    },

    async selectCountry(req, res) {
      sendSuccess(res, await authService.selectCountry({ userId: req.user.id, ...req.validated.body }));
    },

    async saveProfessionalProfile(req, res) {
      sendSuccess(
        res,
        await onboardingService.saveProfessionalProfile({ userId: req.user.id, ...req.validated.body }),
      );
    },

    // Middleware before the multipart parser of POST /me/documents (TASK-053): refuses an Account that
    // cannot submit anything before its body is read.
    async checkCanSubmitDocuments(req, _res, next) {
      await onboardingService.assertCanSubmitDocuments({ userId: req.user.id });
      next();
    },

    async submitDocuments(req, res) {
      const { documents } = req.validated;
      sendSuccess(res, await onboardingService.submitDocuments({ userId: req.user.id, documents }), {
        status: 201,
      });
    },

    async getVerification(req, res) {
      sendSuccess(res, await onboardingService.getVerification({ userId: req.user.id }));
    },
  };
}
