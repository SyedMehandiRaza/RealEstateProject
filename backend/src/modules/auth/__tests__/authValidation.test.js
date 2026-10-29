import request from 'supertest';
import { commonMessages } from '@real-estate/shared';
import { resendCodeCases, signUpCases, verifyCodeCases } from '@real-estate/shared/testing';
import { createTestApp } from '../../../test/testApp.js';

// Validation parity: every invalid payload of the shared schema tests, posted to the API, comes back as
// 422 with the same shared message under the same field. Validation runs before any query, so these
// need no database. Each case is its own test, so the per-IP limiter (reset before each test) never trips.

const ROUTES = [
  ['POST /api/auth/sign-up', '/api/auth/sign-up', signUpCases],
  ['POST /api/auth/verify-email', '/api/auth/verify-email', verifyCodeCases],
  ['POST /api/auth/verify-email/resend', '/api/auth/verify-email/resend', resendCodeCases],
];

describe.each(ROUTES)('%s rejects invalid input with the shared messages', (_name, path, cases) => {
  const { app, mailer } = createTestApp();

  it.each(cases.invalid)('$name', async ({ input, field, message }) => {
    const res = await request(app)
      .post(path)
      .send({ ...cases.valid, ...input });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe(commonMessages.invalidInput);
    expect(res.body.error.fields[field]).toContain(message);
    expect(mailer.messages).toEqual([]);
  });
});

describe('per-IP auth limiter', () => {
  it('applies one shared count to sign-up, verify-email and its resend', async () => {
    const { app } = createTestApp();
    const invalid = { ...signUpCases.valid, role: 'admin' };
    for (let i = 0; i < 20; i += 1) {
      expect((await request(app).post('/api/auth/sign-up').send(invalid)).status).toBe(422);
    }

    const signUp = await request(app).post('/api/auth/sign-up').send(invalid);
    const verify = await request(app).post('/api/auth/verify-email').send(verifyCodeCases.valid);
    const resend = await request(app).post('/api/auth/verify-email/resend').send(resendCodeCases.valid);

    expect(signUp.status).toBe(429);
    expect(signUp.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(verify.status).toBe(429);
    expect(resend.status).toBe(429);
  });
});
