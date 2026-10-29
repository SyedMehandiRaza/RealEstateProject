// Runs before every test file of both Jest projects (unit and integration).
import { resetRateLimiters } from '../middlewares/rateLimiter.js';
import { resetLoginAttemptLimiters } from '../modules/auth/loginAttemptLimiter.js';

beforeEach(() => {
  resetLoginAttemptLimiters();
  return resetRateLimiters();
});
