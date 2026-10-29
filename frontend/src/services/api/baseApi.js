import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '../../config/env.js';
import { credentialsSet, loggedOut } from '../../modules/auth/store/authSlice.js';

// Assumed contract (confirm when the auth API is specified):
//   POST {apiUrl}/auth/refresh  (refresh cookie)  ->  { success: true, data: { accessToken, user } }
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

const urlOf = (args) => (typeof args === 'string' ? args : args.url);

// One shared refresh request, so parallel 401s trigger a single refresh.
let refreshPromise = null;

export async function baseQueryWithReauth(args, api, extraOptions) {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && urlOf(args) !== REFRESH_PATH) {
    refreshPromise ??= rawBaseQuery({ url: REFRESH_PATH, method: 'POST' }, api, extraOptions).finally(() => {
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
