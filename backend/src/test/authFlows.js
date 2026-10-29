import request from 'supertest';
import { signUpCases } from '@real-estate/shared/testing';

// Steps of the auth journeys, for integration tests that need an Account in a given state.

export const SIGN_UP = '/api/auth/sign-up';
export const VERIFY_EMAIL = '/api/auth/verify-email';
export const RESEND_VERIFICATION = '/api/auth/verify-email/resend';

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

// Asks for a new email_verification code. Returns the response.
export function resendVerification(app, email) {
  return request(app).post(RESEND_VERIFICATION).send({ email });
}

export const LOGIN = '/api/auth/login';
export const ME = '/api/auth/me';

// Logs in with the sign-up defaults unless overridden. Returns the response.
export function logIn(app, { email = signUpCases.valid.email, password = signUpCases.valid.password } = {}) {
  return request(app).post(LOGIN).send({ email, password });
}

export const REFRESH = '/api/auth/refresh';
export const LOGOUT = '/api/auth/logout';

// The refresh token in a response's `refresh_token` Set-Cookie header, or undefined if none was set.
export function refreshTokenOf(res) {
  const cookie = (res.headers['set-cookie'] ?? []).find((c) => c.startsWith('refresh_token='));
  return cookie && decodeURIComponent(cookie.split(';')[0].slice('refresh_token='.length));
}

const withRefreshCookie = (req, token) =>
  token === undefined ? req : req.set('Cookie', `refresh_token=${encodeURIComponent(token)}`);

// POST /refresh, sending `token` as the refresh cookie (no cookie when undefined). Returns the response.
export function refresh(app, token) {
  return withRefreshCookie(request(app).post(REFRESH), token);
}

// POST /logout, sending `token` as the refresh cookie (no cookie when undefined). Returns the response.
export function logOut(app, token) {
  return withRefreshCookie(request(app).post(LOGOUT), token);
}

export const FORGOT_PASSWORD = '/api/auth/password/forgot';
export const RESEND_PASSWORD_RESET = '/api/auth/password/resend';
export const VERIFY_PASSWORD_RESET = '/api/auth/password/verify';

// Asks for a password_reset code. Returns the response.
export function forgotPassword(app, email) {
  return request(app).post(FORGOT_PASSWORD).send({ email });
}

// Asks for a new password_reset code. Returns the response.
export function resendPasswordReset(app, email) {
  return request(app).post(RESEND_PASSWORD_RESET).send({ email });
}

// Posts a password_reset code. Returns the response ({ resetToken } on success).
export function verifyPasswordReset(app, { email, code }) {
  return request(app).post(VERIFY_PASSWORD_RESET).send({ email, code });
}
