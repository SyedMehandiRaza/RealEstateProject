// Login attempt limiter (SPEC-001, DEC-022): at most 10 failed logins per email in any rolling 15 minutes,
// on top of the per-IP authRateLimiter. Unknown emails are counted like real ones, so a refusal never
// reveals which Accounts exist, and a successful login clears the count. State lives in process memory:
// it is per API instance and starts empty on restart (no schema change).

export const MAX_FAILED_LOGINS = 10;
export const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Every limiter created, so tests can reset them all between tests (like resetRateLimiters).
const limiters = new Set();

export function createLoginAttemptLimiter({
  clock,
  maxFailures = MAX_FAILED_LOGINS,
  windowMs = FAILED_LOGIN_WINDOW_MS,
}) {
  // email (normalized by the shared schema) -> times (ms) of its failures in the window, oldest first.
  const failures = new Map();
  let lastSweep = clock.now().getTime();

  // A failure counts while it is less than windowMs old: one at t stops counting at exactly t + windowMs.
  const inWindow = (times, now) => times.filter((time) => time > now - windowMs);

  // Drops emails whose failures all left the window, at most once per window, so the map holds only
  // recently failing emails however many different ones are tried.
  function sweep(now) {
    if (now - lastSweep < windowMs) return;
    lastSweep = now;
    for (const [email, times] of failures) {
      if (inWindow(times, now).length === 0) failures.delete(email);
    }
  }

  const limiter = {
    // Call before checking the password. Returns false when the email already has maxFailures failures
    // in the window: refuse without checking. Otherwise the attempt is counted as a failure at once, so
    // parallel guesses cannot slip past the limit; call succeeded() when the password was right.
    tryAttempt(email) {
      const now = clock.now().getTime();
      sweep(now);
      const times = inWindow(failures.get(email) ?? [], now);
      if (times.length >= maxFailures) {
        failures.set(email, times);
        return false;
      }
      times.push(now);
      failures.set(email, times);
      return true;
    },

    // The password was right: forget the email's failures.
    succeeded(email) {
      failures.delete(email);
    },

    reset() {
      failures.clear();
    },
  };
  limiters.add(limiter);
  return limiter;
}

// Tests only (called in a beforeEach for every suite, next to resetRateLimiters): forget every count.
export function resetLoginAttemptLimiters() {
  for (const limiter of limiters) limiter.reset();
}
