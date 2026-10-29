import { createTestClock } from '../../../test/testClock.js';
import {
  createLoginAttemptLimiter,
  FAILED_LOGIN_WINDOW_MS,
  MAX_FAILED_LOGINS,
  resetLoginAttemptLimiters,
} from '../loginAttemptLimiter.js';

const EMAIL = 'sara@example.com';
const SECOND = 1000;

describe('login attempt limiter', () => {
  let clock;
  let limiter;

  // `count` failed attempts (each tryAttempt that is not followed by succeeded is a failure).
  const fail = (count, email = EMAIL) => {
    for (let i = 0; i < count; i += 1) expect(limiter.tryAttempt(email)).toBe(true);
  };

  beforeEach(() => {
    clock = createTestClock(new Date('2026-10-29T10:00:00Z'));
    limiter = createLoginAttemptLimiter({ clock });
  });

  it('allows 10 failed attempts per 15 minutes per email (DEC-022)', () => {
    expect(MAX_FAILED_LOGINS).toBe(10);
    expect(FAILED_LOGIN_WINDOW_MS).toBe(15 * 60 * SECOND);
  });

  it('checks the 10th attempt and refuses the 11th', () => {
    fail(9);
    expect(limiter.tryAttempt(EMAIL)).toBe(true);
    expect(limiter.tryAttempt(EMAIL)).toBe(false);
    expect(limiter.tryAttempt(EMAIL)).toBe(false);
  });

  it('counts per email', () => {
    fail(10);
    expect(limiter.tryAttempt(EMAIL)).toBe(false);
    expect(limiter.tryAttempt('omar@example.com')).toBe(true);
  });

  it('counts emails that have no Account like any other (it never looks them up)', () => {
    fail(10, 'nobody@example.com');
    expect(limiter.tryAttempt('nobody@example.com')).toBe(false);
  });

  it('a success clears the count', () => {
    fail(9);
    expect(limiter.tryAttempt(EMAIL)).toBe(true);
    limiter.succeeded(EMAIL);
    fail(10);
    expect(limiter.tryAttempt(EMAIL)).toBe(false);
  });

  it('a failure stops counting exactly 15 minutes after it happened', () => {
    fail(1);
    clock.advance(5 * 60 * SECOND);
    fail(9);
    expect(limiter.tryAttempt(EMAIL)).toBe(false);

    clock.advance(10 * 60 * SECOND - 1);
    expect(limiter.tryAttempt(EMAIL)).toBe(false);

    // 15:00 after the first failure: only the 9 later ones still count.
    clock.advance(1);
    expect(limiter.tryAttempt(EMAIL)).toBe(true);
    expect(limiter.tryAttempt(EMAIL)).toBe(false);
  });

  it('refused attempts do not extend the block', () => {
    fail(10);
    clock.advance(10 * 60 * SECOND);
    expect(limiter.tryAttempt(EMAIL)).toBe(false);
    clock.advance(5 * 60 * SECOND);
    expect(limiter.tryAttempt(EMAIL)).toBe(true);
  });

  it('keeps working for an email after its old entries are swept', () => {
    fail(10, 'old@example.com');
    clock.advance(FAILED_LOGIN_WINDOW_MS);
    fail(1);
    expect(limiter.tryAttempt('old@example.com')).toBe(true);
  });

  it('resetLoginAttemptLimiters forgets every count (tests only)', () => {
    fail(10);
    resetLoginAttemptLimiters();
    expect(limiter.tryAttempt(EMAIL)).toBe(true);
  });
});
