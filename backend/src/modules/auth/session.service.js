import { hashToken, signAccessToken, signRefreshToken } from '../../utils/jwt.js';

// Login sessions: an access token for the JSON body and a refresh token for the httpOnly cookie. Only the
// refresh token's hash is stored. Refresh, rotation and logout come with TASK-022.
export function createSessionService({ models }) {
  const { RefreshToken } = models;

  return {
    // `roles` are the role names the access token carries.
    async start({ userId, roles }, { transaction } = {}) {
      const refresh = signRefreshToken({ userId });
      await RefreshToken.create(
        { userId, jti: refresh.jti, tokenHash: hashToken(refresh.token), expiresAt: refresh.expiresAt },
        { transaction },
      );
      return {
        accessToken: signAccessToken({ userId, roles }),
        refreshToken: { token: refresh.token, expiresAt: refresh.expiresAt },
      };
    },
  };
}
