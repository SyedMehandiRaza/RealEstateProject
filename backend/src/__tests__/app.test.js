import request from 'supertest';
import { ERROR_CODES } from '@real-estate/shared';
import { createApp } from '../app.js';
import { AUTH_RATE_LIMIT } from '../middlewares/rateLimiter.js';
import { cloudinaryStorage } from '../modules/files/cloudinary.storage.js';
import { smtpMailer } from '../modules/mail/smtp.mailer.js';
import { createFakeMailer } from '../test/fakeMailer.js';
import { createTestApp } from '../test/testApp.js';
import { systemClock } from '../utils/clock.js';

const app = createApp();

describe('app', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('unknown route returns the NOT_FOUND error contract', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: ERROR_CODES.NOT_FOUND.message },
    });
  });

  it('malformed JSON returns BAD_REQUEST', async () => {
    const res = await request(app).post('/api/health').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('sets security headers and hides x-powered-by', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('createApp dependencies', () => {
  it('defaults to the real mailer, storage and clock when nothing is injected', () => {
    const { dependencies } = createApp().locals;
    expect(dependencies.storage).toBe(cloudinaryStorage);
    expect(dependencies.clock).toBe(systemClock);
    expect(dependencies.mailer).toBe(smtpMailer);
  });

  it('uses the injected fakes', () => {
    const { app, mailer, storage, clock } = createTestApp();
    expect(app.locals.dependencies).toEqual({ mailer, storage, clock });
  });

  it('rejects an unknown dependency name, so a typo cannot silently fall back to the real one', () => {
    expect(() => createApp({ mailler: createFakeMailer() })).toThrow(
      /Unknown createApp dependency "mailler"/,
    );
  });

  it('rejects a dependency missing a required method', () => {
    expect(() => createApp({ clock: {} })).toThrow(/clock must implement now\(\)/);
  });
});

// TASK-053: the client IP comes from X-Forwarded-For only when TRUST_PROXY says how many proxies to trust.
// By default (no proxy) a forged header must not give a fresh per-IP budget.
describe('trust proxy', () => {
  beforeEach(() => {
    // express-rate-limit warns (console.error) about an X-Forwarded-For header it is told not to trust.
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is off by default', () => {
    expect(createApp().get('trust proxy')).toBe(false);
  });

  it('does not reset the per-IP limiter when X-Forwarded-For changes on every request', async () => {
    const { app: testApp } = createTestApp();
    // Empty bodies are counted by the limiter, then refused by validation before any query.
    const post = (i) =>
      request(testApp).post('/api/auth/login').set('X-Forwarded-For', `203.0.113.${i}`).send({});
    for (let i = 0; i < AUTH_RATE_LIMIT; i += 1) expect((await post(i)).status).toBe(422);
    const blocked = await post(AUTH_RATE_LIMIT);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
