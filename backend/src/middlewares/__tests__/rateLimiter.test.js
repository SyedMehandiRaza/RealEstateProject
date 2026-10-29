import express from 'express';
import request from 'supertest';
import {
  AUTH_RATE_LIMIT,
  AUTH_RATE_WINDOW_MS,
  DOCUMENT_UPLOAD_RATE_LIMIT,
  DOCUMENT_UPLOAD_RATE_WINDOW_MS,
  documentUploadRateLimiter,
  loginRateLimiter,
  oneRequestAtATime,
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

// TASK-053: POST /me/documents, keyed on the signed-in Account, not the IP.
describe('document upload limits', () => {
  const asUser = (req, _res, next) => {
    req.user = { id: Number(req.headers['x-user']) };
    next();
  };

  describe('documentUploadRateLimiter', () => {
    const limited = express();
    limited.post('/documents', asUser, documentUploadRateLimiter, (_req, res) => res.json({ ok: true }));
    const submit = (userId) => request(limited).post('/documents').set('X-User', String(userId));

    it('allows 10 submissions per hour per Account', () => {
      expect(DOCUMENT_UPLOAD_RATE_LIMIT).toBe(10);
      expect(DOCUMENT_UPLOAD_RATE_WINDOW_MS).toBe(60 * 60 * 1000);
    });

    it("blocks an Account's 11th submission, but not another Account's", async () => {
      for (let i = 0; i < DOCUMENT_UPLOAD_RATE_LIMIT; i += 1) expect((await submit(1)).status).toBe(200);
      const blocked = await submit(1);
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
      expect((await submit(2)).status).toBe(200);
    });

    // Relies on running after the test above.
    it('is reset between tests like the per-IP limiters', async () => {
      expect((await submit(1)).status).toBe(200);
    });
  });

  describe('oneRequestAtATime', () => {
    function gatedApp() {
      const gate = { release: null };
      const app = express();
      app.post('/documents', asUser, oneRequestAtATime(), async (req, res) => {
        if (req.headers['x-hold']) await new Promise((resolve) => (gate.release = resolve));
        res.json({ ok: true });
      });
      return { app, gate };
    }

    it('answers 429 to a second request of the same Account while the first is in flight', async () => {
      const { app, gate } = gatedApp();
      const first = request(app).post('/documents').set('X-User', '1').set('X-Hold', '1').then();
      await new Promise((resolve) => {
        const wait = () => (gate.release ? resolve() : setTimeout(wait, 5));
        wait();
      });

      const second = await request(app).post('/documents').set('X-User', '1');
      expect(second.status).toBe(429);
      expect(second.body.error.code).toBe('TOO_MANY_REQUESTS');
      expect((await request(app).post('/documents').set('X-User', '2')).status).toBe(200);

      gate.release();
      expect((await first).status).toBe(200);
      expect((await request(app).post('/documents').set('X-User', '1')).status).toBe(200);
    });

    it('frees the slot when the request fails', async () => {
      const app = express();
      app.post('/documents', asUser, oneRequestAtATime(), () => {
        throw new Error('boom');
      });
      app.use((_err, _req, res, _next) => res.status(500).end());
      expect((await request(app).post('/documents').set('X-User', '1')).status).toBe(500);
      expect((await request(app).post('/documents').set('X-User', '1')).status).toBe(500);
    });
  });
});
