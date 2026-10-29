import { createSlice } from '@reduxjs/toolkit';

// The access token lives only in memory (Redux). The refresh token is an httpOnly cookie the JS never sees.
const initialState = { accessToken: null, user: null };

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
  },
});

export const { credentialsSet, loggedOut } = authSlice.actions;
export default authSlice.reducer;

export const selectAccessToken = (state) => state.auth.accessToken;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);
