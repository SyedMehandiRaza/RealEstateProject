import rateLimit, { MemoryStore } from 'express-rate-limit';
import { ERROR_CODES } from '@real-estate/shared';

const limitedResponse = {
  success: false,
  error: { code: 'TOO_MANY_REQUESTS', message: ERROR_CODES.TOO_MANY_REQUESTS.message },
};

// Every limiter's store, so tests can reset them all. Create limiters with createLimiter only.
const stores = [];

function createLimiter(options) {
  const store = new MemoryStore();
  stores.push(store);
  return rateLimit({
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: limitedResponse,
    ...options,
    store,
  });
}

// Public auth routes: one per-IP limiter per route group, each with its own count, so using up one
// group (say, a long sign-up) never blocks login (DEC-039, Q-041). The per-account login limit is
// separate (modules/auth/loginAttemptLimiter.js).
export const AUTH_RATE_LIMIT = 20;
export const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;
const createAuthLimiter = () => createLimiter({ windowMs: AUTH_RATE_WINDOW_MS, limit: AUTH_RATE_LIMIT });

// Sign-up, verify-email and its resend.
export const signUpRateLimiter = createAuthLimiter();
// Login.
export const loginRateLimiter = createAuthLimiter();
// Forgot password, its resend, verify code and reset.
export const passwordResetRateLimiter = createAuthLimiter();

// Tests only (called in a beforeEach for every suite): forget every client's count, so the requests of
// one test never throttle the next.
export function resetRateLimiters() {
  return Promise.all(stores.map((store) => store.resetAll()));
}
