import { authMessages, ERROR_CODES } from '@real-estate/shared';
import { resetPasswordCases } from '@real-estate/shared/testing';
import { expect, test } from '../../fixtures/harness.js';
import { ForgotPasswordPage } from '../../pages/auth/ForgotPasswordPage.page.js';
import { LoginPage } from '../../pages/auth/LoginPage.page.js';
import { ResetPasswordPage } from '../../pages/auth/ResetPasswordPage.page.js';
import { SelectCountryPage } from '../../pages/auth/SelectCountryPage.page.js';
import { VerifyEmailPage } from '../../pages/auth/VerifyEmailPage.page.js';

// TASK-052: the TASK-050 limits (DEC-039) in a real browser. The per-IP limiters are one per route group
// (20 per 15 minutes each), and a password reset clears the per-account login lockout (10 failures).
// The harness resets every limiter before each test. The browser and the `request` fixture both reach
// the API through the Vite proxy, so they count as the same client.

const m = authMessages;
const AUTH_RATE_LIMIT = 20;
const MAX_FAILED_LOGINS = 10;

test('using up the password-reset limiter leaves Log in working', async ({ page, request, harness }) => {
  const buyer = await harness.seedBuyer();
  // Empty bodies are counted by the limiter, then refused by validation (422) without a database call.
  for (let i = 0; i < AUTH_RATE_LIMIT; i += 1) {
    expect((await request.post('/api/auth/password/forgot', { data: {} })).status()).toBe(422);
  }

  const forgot = new ForgotPasswordPage(page);
  await forgot.goto();
  await forgot.requestCode(buyer.email);
  await expect(forgot.alert).toHaveText(ERROR_CODES.TOO_MANY_REQUESTS.message);
  await expect(page).toHaveURL('/forgot-password');

  const login = new LoginPage(page);
  await login.goto();
  await login.logIn(buyer);
  await expect(page).toHaveURL('/onboarding/country');
});

test('after 10 failed logins, a password reset lets the new password log in at once', async ({
  page,
  request,
  harness,
}) => {
  const buyer = await harness.seedBuyer();
  for (let i = 0; i < MAX_FAILED_LOGINS; i += 1) {
    const res = await request.post('/api/auth/login', {
      data: { email: buyer.email, password: 'wrong-password1' },
    });
    expect(res.status()).toBe(401);
  }

  // Locked: even the right password is refused, with the same message as a wrong one.
  const login = new LoginPage(page);
  await login.goto();
  await login.logIn(buyer);
  await expect(login.alert).toHaveText(m.api.invalidCredentials);

  const forgot = new ForgotPasswordPage(page);
  await forgot.goto();
  await forgot.requestCode(buyer.email);
  const verify = new VerifyEmailPage(page);
  await expect(verify.heading).toBeVisible();
  await verify.verify(await harness.latestCode(buyer.email, 'password_reset'));
  const reset = new ResetPasswordPage(page);
  await expect(reset.heading).toBeVisible();
  const newPassword = resetPasswordCases.valid.password;
  await reset.reset({ password: newPassword });

  await expect(page).toHaveURL('/login');
  await expect(login.notice).toHaveText(m.api.passwordChanged);
  await login.logIn({ email: buyer.email, password: newPassword });
  await expect(page).toHaveURL('/onboarding/country');
  await expect(new SelectCountryPage(page).heading).toBeVisible();
});
