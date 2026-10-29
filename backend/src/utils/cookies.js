import { env } from '../config/env.js';

export const REFRESH_COOKIE_NAME = 'refresh_token';

// The refresh cookie is only sent to the auth routes, never readable by JavaScript.
export function refreshCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    path: '/api/auth',
    expires: expiresAt,
  };
}

export const clearRefreshCookieOptions = () => {
  const { expires: _expires, ...options } = refreshCookieOptions();
  return options;
};
