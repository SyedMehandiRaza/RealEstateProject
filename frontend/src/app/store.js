import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../services/api/baseApi.js';
import authReducer from '../modules/auth/store/authSlice.js';

const rootReducer = combineReducers({
  auth: authReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

// Factory so tests get an isolated store with optional preloaded state.
export function makeStore(preloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });
}

export const store = makeStore();
