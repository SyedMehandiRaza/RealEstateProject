import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '../../config/env.js';
import { credentialsSet, loggedOut } from '../../modules/auth/store/authSlice.js';

// SPEC-001 (docs/execution/specs/SPEC-001-auth-api.md):
//   POST {apiUrl}/auth/refresh  (refresh cookie)  ->  200 { success: true, data: { accessToken, user } }, rotated cookie
export const REFRESH_PATH = '/auth/refresh';

// SPEC-001 public auth routes: they take no access token, so a 401 there is the answer itself
// (invalidCredentials, an expired reset token, ...) and must not trigger a refresh.
const PUBLIC_AUTH_PATHS = new Set([
  REFRESH_PATH,
  '/auth/login',
  '/auth/sign-up',
  '/auth/verify-email',
  '/auth/verify-email/resend',
  '/auth/password/forgot',
  '/auth/password/verify',
  '/auth/password/resend',
  '/auth/password/reset',
]);

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

const pathOf = (args) => (typeof args === 'string' ? args : args.url).split('?')[0];

// Web Locks name shared by every tab of this origin (TASK-046, Q-038, DEC-028).
export const REFRESH_LOCK = 'auth-refresh';

// The API revokes every session of the Account when a refresh token that was already rotated comes
// back. Two tabs share one cookie, so two refreshes in flight at once would log the user out
// everywhere. The lock makes tabs refresh one after the other: a tab that waited sends its request
// after the first tab's response has stored the rotated cookie in the shared jar, so it presents the
// new cookie (one more rotation, no reuse). Without `navigator.locks` (old browsers, jsdom) the
// refresh runs directly, shared only inside this tab.
function withRefreshLock(task) {
  const locks = globalThis.navigator?.locks;
  return typeof locks?.request === 'function' ? locks.request(REFRESH_LOCK, task) : task();
}

// One shared refresh per tab, so parallel 401s in this tab trigger a single refresh (and one lock).
let refreshPromise = null;

export async function baseQueryWithReauth(args, api, extraOptions) {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !PUBLIC_AUTH_PATHS.has(pathOf(args))) {
    refreshPromise ??= withRefreshLock(() =>
      rawBaseQuery({ url: REFRESH_PATH, method: 'POST' }, api, extraOptions),
    ).finally(() => {
      refreshPromise = null;
    });
    const refreshResult = await refreshPromise;
    const credentials = refreshResult.data?.data;

    if (credentials?.accessToken) {
      api.dispatch(credentialsSet(credentials));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(loggedOut());
    }
  }
  return result;
}

// Modules add endpoints with baseApi.injectEndpoints({ endpoints: (build) => ({ ... }) }).
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [],
  endpoints: () => ({}),
});
