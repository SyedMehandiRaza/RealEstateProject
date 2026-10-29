import { baseApi } from '../../../services/api/baseApi.js';

// Auth endpoints (SPEC-001, all under /api/auth). Each page ticket adds its own endpoints here:
// login (TASK-033), signUp / verifyEmail / resendVerification (TASK-034), selectCountry (TASK-035), ...
export const authApi = baseApi.injectEndpoints({
  endpoints: () => ({}),
});
