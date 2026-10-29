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

// Strict limit for login, sign-up, OTP and password-reset routes.
export const authRateLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 20 });

// Tests only (called in a beforeEach for every suite): forget every client's count, so the requests of
// one test never throttle the next.
export function resetRateLimiters() {
  return Promise.all(stores.map((store) => store.resetAll()));
}
