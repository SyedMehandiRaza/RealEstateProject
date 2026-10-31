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

// POST /me/documents (TASK-053, DEC-040): each submission buffers up to 3 x 10 MB, so it is limited per
// signed-in Account (req.user, so after authenticate), not per IP. 10 per hour is an assumption.
export const DOCUMENT_UPLOAD_RATE_LIMIT = 10;
export const DOCUMENT_UPLOAD_RATE_WINDOW_MS = 60 * 60 * 1000;
export const documentUploadRateLimiter = createLimiter({
  windowMs: DOCUMENT_UPLOAD_RATE_WINDOW_MS,
  limit: DOCUMENT_UPLOAD_RATE_LIMIT,
  keyGenerator: (req) => `user:${req.user.id}`,
});

// At most one request at a time per signed-in Account (use after authenticate): another one while the
// first is in flight gets 429 TOO_MANY_REQUESTS. The slot is freed when the response ends or the
// connection closes. In memory, per router instance (one per app), like the limiters.
export function oneRequestAtATime() {
  const inFlight = new Set();
  return (req, res, next) => {
    const key = req.user.id;
    if (inFlight.has(key)) return res.status(429).json(limitedResponse);
    inFlight.add(key);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      inFlight.delete(key);
    };
    res.once('finish', release);
    res.once('close', release);
    next();
  };
}

// Tests only (called in a beforeEach for every suite): forget every client's count, so the requests of
// one test never throttle the next.
export function resetRateLimiters() {
  return Promise.all(stores.map((store) => store.resetAll()));
}

// Property file uploads (PROP-SPEC-001, assumption confirmed by the user): every route that stores a property
// file counts, per signed-in Account (use after authenticate). Each request buffers up to one 40 MB video.
export const PROPERTY_UPLOAD_RATE_LIMIT = 200;
export const PROPERTY_UPLOAD_RATE_WINDOW_MS = 60 * 60 * 1000;
export const propertyUploadRateLimiter = createLimiter({
  windowMs: PROPERTY_UPLOAD_RATE_WINDOW_MS,
  limit: PROPERTY_UPLOAD_RATE_LIMIT,
  keyGenerator: (req) => `user:${req.user.id}`,
});
