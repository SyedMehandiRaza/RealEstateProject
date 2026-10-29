import express from 'express';
import request from 'supertest';
import { authRateLimiter, resetRateLimiters } from '../rateLimiter.js';

const app = express();
app.post('/limited', authRateLimiter, (_req, res) => res.json({ ok: true }));

const exhaust = async () => {
  for (let i = 0; i < 20; i += 1) {
    expect((await request(app).post('/limited')).status).toBe(200);
  }
};

// The two "fresh count" tests rely on running after the test that exhausts the limit.
describe('authRateLimiter', () => {
  it('blocks the 21st request in the window with TOO_MANY_REQUESTS', async () => {
    await exhaust();
    const blocked = await request(app).post('/limited');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('starts the next test with a fresh count (the shared beforeEach resets every limiter)', async () => {
    expect((await request(app).post('/limited')).status).toBe(200);
  });

  it('resetRateLimiters clears the count mid-test', async () => {
    await exhaust();
    expect((await request(app).post('/limited')).status).toBe(429);
    await resetRateLimiters();
    expect((await request(app).post('/limited')).status).toBe(200);
  });
});
