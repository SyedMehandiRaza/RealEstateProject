import { REFRESH_COOKIE_NAME, refreshCookieOptions } from '../../utils/cookies.js';
import { sendSuccess } from '../../utils/response.js';

// HTTP only: read the validated input, call the service, send the response. The refresh token is only
// ever sent as the httpOnly cookie, never in the body.
export function createAuthController(authService) {
  const startSession = (res, { accessToken, refreshToken, user }) => {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken.token, refreshCookieOptions(refreshToken.expiresAt));
    return sendSuccess(res, { accessToken, user });
  };

  return {
    async signUp(req, res) {
      sendSuccess(res, await authService.signUp(req.validated.body), { status: 201 });
    },

    async verifyEmail(req, res) {
      startSession(res, await authService.verifyEmail(req.validated.body));
    },
  };
}
