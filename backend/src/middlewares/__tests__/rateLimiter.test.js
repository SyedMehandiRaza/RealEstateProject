import express from 'express';
import request from 'supertest';
import {
  AUTH_RATE_LIMIT,
  AUTH_RATE_WINDOW_MS,
  loginRateLimiter,
  passwordResetRateLimiter,
  resetRateLimiters,
  signUpRateLimiter,
} from '../rateLimiter.js';

// One per-IP limiter per auth route group (DEC-039, Q-041), each with its own count.
const LIMITERS = {
  signUp: signUpRateLimiter,
  login: loginRateLimiter,
  passwordReset: passwordResetRateLimiter,
};

const app = express();
for (const [name, limiter] of Object.entries(LIMITERS)) {
  app.post(`/${name}`, limiter, (_req, res) => res.json({ ok: true }));
}

const post = (name) => request(app).post(`/${name}`);
const exhaust = async (name) => {
  for (let i = 0; i < AUTH_RATE_LIMIT; i += 1) expect((await post(name)).status).toBe(200);
};

describe('auth rate limiters', () => {
  it('allows 20 requests per 15 minutes per group', () => {
    expect(AUTH_RATE_LIMIT).toBe(20);
    expect(AUTH_RATE_WINDOW_MS).toBe(15 * 60 * 1000);
  });

  describe.each(Object.keys(LIMITERS))('%s', (name) => {
    const others = Object.keys(LIMITERS).filter((other) => other !== name);

    it('blocks the 21st request in the window with TOO_MANY_REQUESTS', async () => {
      await exhaust(name);
      const blocked = await post(name);
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
    });

    it('keeps its own count: the other groups still answer once it is exhausted', async () => {
      await exhaust(name);
      expect((await post(name)).status).toBe(429);
      for (const other of others) expect((await post(other)).status).toBe(200);
    });

    // Relies on running after a test that exhausted this group.
    it('starts the next test with a fresh count (the shared beforeEach resets every limiter)', async () => {
      expect((await post(name)).status).toBe(200);
    });
  });

  it('resetRateLimiters clears every count mid-test', async () => {
    for (const name of Object.keys(LIMITERS)) await exhaust(name);
    for (const name of Object.keys(LIMITERS)) expect((await post(name)).status).toBe(429);
    await resetRateLimiters();
    for (const name of Object.keys(LIMITERS)) expect((await post(name)).status).toBe(200);
  });
});
