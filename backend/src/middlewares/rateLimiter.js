import rateLimit from 'express-rate-limit';
import { ERROR_CODES } from '@real-estate/shared';

const limitedResponse = {
  success: false,
  error: { code: 'TOO_MANY_REQUESTS', message: ERROR_CODES.TOO_MANY_REQUESTS.message },
};

// Strict limit for login, sign-up, OTP and password-reset routes.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: limitedResponse,
});
