import request from 'supertest';
import { signUpCases } from '@real-estate/shared/testing';

// Steps of the auth journeys, for integration tests that need an Account in a given state.

export const SIGN_UP = '/api/auth/sign-up';
export const VERIFY_EMAIL = '/api/auth/verify-email';

// Signs up through the API (valid input by default) and returns the response.
export function signUp(app, overrides = {}) {
  return request(app)
    .post(SIGN_UP)
    .send({ ...signUpCases.valid, ...overrides });
}

// Signs up, then verifies the email with the mailed code. Returns the verify-email response.
export async function signUpAndVerify(app, mailer, overrides = {}) {
  const { body } = await signUp(app, overrides);
  const code = mailer.lastCodeFor(body.data.email, 'email_verification');
  return request(app).post(VERIFY_EMAIL).send({ email: body.data.email, code });
}
