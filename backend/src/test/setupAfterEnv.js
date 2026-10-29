// Runs before every test file of both Jest projects (unit and integration).
import { resetRateLimiters } from '../middlewares/rateLimiter.js';

beforeEach(() => resetRateLimiters());
