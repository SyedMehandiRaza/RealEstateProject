import { refreshAccessToken } from '../../../services/api/baseApi.js';
import { credentialsSet, sessionRestoreFinished, sessionRestoreStarted } from '../store/authSlice.js';
import { authApi } from './authApi.js';

// The access token lives only in memory, so a reload starts logged out. At app start (main.jsx) one
// POST /auth/refresh runs through baseApi's shared refresh (one per tab, inside the cross-tab
// `navigator.locks` lock), and protected routes wait while it is pending (TASK-049). Public pages
// render at once. A failed refresh (no cookie, 401, network error) leaves the user logged out with
// no message. Resolves to true when the session was restored.
const restoreSessionApi = authApi.injectEndpoints({
  endpoints: (build) => ({
    restoreSession: build.mutation({
      async queryFn(_arg, api, extraOptions) {
        const credentials = await refreshAccessToken(api, extraOptions);
        // A login finished while the refresh was in flight wins: never replace a newer session.
        const restored = Boolean(credentials) && !api.getState().auth.accessToken;
        if (restored) api.dispatch(credentialsSet(credentials));
        return { data: restored };
      },
    }),
  }),
});

export async function restoreSession(dispatch) {
  // Synchronous, so the first render already sees the pending restore.
  dispatch(sessionRestoreStarted());
  const request = dispatch(restoreSessionApi.endpoints.restoreSession.initiate());
  try {
    const { data } = await request;
    return data === true;
  } finally {
    request.reset();
    dispatch(sessionRestoreFinished());
  }
}
