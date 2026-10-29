import { clearRefreshCookieOptions, REFRESH_COOKIE_NAME, refreshCookieOptions } from '../../utils/cookies.js';
import { sendSuccess } from '../../utils/response.js';

// HTTP only: read the validated input, call the service, send the response. The refresh token is only
// ever sent as the httpOnly cookie, never in the body.
export function createAuthController(authService) {
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

    async login(req, res) {
      startSession(res, await authService.login(req.validated.body));
    },

    // A refused refresh also clears the cookie, so the browser stops sending a dead token. Other errors
    // (such as the database being down) keep it, so the session can resume.
    async refresh(req, res) {
      try {
        startSession(res, await authService.refresh({ refreshToken: refreshTokenOf(req) }));
      } catch (error) {
        if (error?.code === 'UNAUTHORIZED') clearSession(res);
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
  };
}
