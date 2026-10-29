import { createSlice } from '@reduxjs/toolkit';

// The access token lives only in memory (Redux). The refresh token is an httpOnly cookie the JS never sees.
// `restoringSession` is true while the app-start refresh runs (api/restoreSession.js, TASK-049), so
// protected routes wait for it instead of sending a user who still has a session to Log in.
const initialState = { accessToken: null, user: null, restoringSession: false };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    credentialsSet(state, action) {
      state.accessToken = action.payload.accessToken;
      if (action.payload.user !== undefined) state.user = action.payload.user;
    },
    loggedOut() {
      return initialState;
    },
    sessionRestoreStarted(state) {
      state.restoringSession = true;
    },
    sessionRestoreFinished(state) {
      state.restoringSession = false;
    },
  },
});

export const { credentialsSet, loggedOut, sessionRestoreStarted, sessionRestoreFinished } = authSlice.actions;
export default authSlice.reducer;

export const selectAccessToken = (state) => state.auth.accessToken;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);
export const selectIsRestoringSession = (state) => Boolean(state.auth.restoringSession);
