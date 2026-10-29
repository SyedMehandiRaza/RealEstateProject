import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '../../config/env.js';
import { credentialsSet, loggedOut } from '../../modules/auth/store/authSlice.js';

// SPEC-001 (docs/execution/specs/SPEC-001-auth-api.md):
//   POST {apiUrl}/auth/refresh  (refresh cookie)  ->  200 { success: true, data: { accessToken, user } }, rotated cookie
export const REFRESH_PATH = '/auth/refresh';

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

// A 401 means "access token expired" only for a request that carried one (DEC-028, TASK-049). A
// request sent without it (the public auth routes, or anything sent while logged out) gets its 401 as
// the answer itself (invalidCredentials, an expired reset token, ...), so it never triggers a refresh.
const sentAccessToken = (result) => Boolean(result.meta?.request?.headers.get('authorization'));

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

// One shared refresh per tab, so parallel callers in this tab trigger a single refresh (and one lock).
let refreshPromise = null;

// POST /auth/refresh through the shared path (one per tab, inside the cross-tab lock). Resolves to
// `{ accessToken, user }`, or null when the session cannot be refreshed (401, network error). Used by
// the 401 retry below and by the session restore at app start (modules/auth/api/restoreSession.js).
export async function refreshAccessToken(api, extraOptions) {
  refreshPromise ??= withRefreshLock(() =>
    rawBaseQuery({ url: REFRESH_PATH, method: 'POST' }, api, extraOptions),
  ).finally(() => {
    refreshPromise = null;
  });
  const refreshResult = await refreshPromise;
  const credentials = refreshResult.data?.data;
  return credentials?.accessToken ? credentials : null;
}

export async function baseQueryWithReauth(args, api, extraOptions) {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && sentAccessToken(result) && pathOf(args) !== REFRESH_PATH) {
    const credentials = await refreshAccessToken(api, extraOptions);

    if (credentials) {
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
