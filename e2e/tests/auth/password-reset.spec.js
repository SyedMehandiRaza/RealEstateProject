import { authMessages, LIMITS } from '@real-estate/shared';
import { forgotPasswordCases, resetPasswordCases, verifyCodeCases } from '@real-estate/shared/testing';
import { expect, test } from '../../fixtures/harness.js';
import { forbidRequests, formCases, sendPastClient } from '../../fixtures/parity.js';
import { expectPageScreenshot } from '../../fixtures/visual.js';
import { ForgotPasswordPage } from '../../pages/auth/ForgotPasswordPage.page.js';
import { LoginPage } from '../../pages/auth/LoginPage.page.js';
import { ResetPasswordPage } from '../../pages/auth/ResetPasswordPage.page.js';
import { SelectCountryPage } from '../../pages/auth/SelectCountryPage.page.js';
import { VerifyEmailPage } from '../../pages/auth/VerifyEmailPage.page.js';

// TASK-044: password reset against the real API (e2e start mode, DEC-036). The reset pages (TASK-036)
// were built against MSW; this checks Forgot Password -> Verify -> Reset password -> Log in for real,
// with validation parity (on-screen messages are the shared constants) and visual baselines.

const m = authMessages;
const NEW_PASSWORD = resetPasswordCases.valid.password;
const sentCopy = (email) => `We’ve sent a ${LIMITS.auth.codeLength}-digit code to ${email}.`;
const resendTooSoonMessages = Array.from({ length: 60 }, (_, i) => m.api.resendTooSoon(i + 1));

// Forgot Password -> Verify with the emailed password_reset code -> Reset password.
async function openResetPassword(page, harness, email) {
  const forgot = new ForgotPasswordPage(page);
  await forgot.goto();
  await forgot.requestCode(email);
  const verify = new VerifyEmailPage(page);
  await expect(verify.heading).toBeVisible();
  await verify.verify(await harness.latestCode(email, 'password_reset'));
  const reset = new ResetPasswordPage(page);
  await expect(reset.heading).toBeVisible();
  return reset;
}

test.describe('Password reset', () => {
  test('forgot, verify, reset: Log in says the password changed, the old one is refused, the new one works', async ({
    page,
    harness,
  }) => {
    const buyer = await harness.seedBuyer();
    const login = new LoginPage(page);
    await login.goto();
    await login.forgotPasswordLink.click();
    await expect(new ForgotPasswordPage(page).heading).toBeVisible();

    const reset = await openResetPassword(page, harness, buyer.email);
    // The reset token stays in memory: not in the URL (exact match, no query) or browser storage.
    await expect(page).toHaveURL('/reset-password');
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
    await reset.reset({ password: NEW_PASSWORD });

    await expect(page).toHaveURL('/login');
    await expect(login.notice).toHaveText(m.api.passwordChanged);

    await login.logIn({ email: buyer.email, password: buyer.password });
    await expect(login.alert).toHaveText(m.api.invalidCredentials);
    await login.logIn({ email: buyer.email, password: NEW_PASSWORD });
    await expect(page).toHaveURL('/onboarding/country');
    await expect(new SelectCountryPage(page).heading).toBeVisible();
  });

  test('an unknown email gets the same Verify screen and no code is sent', async ({ page, request }) => {
    const email = 'nobody@example.com';
    const forgot = new ForgotPasswordPage(page);
    await forgot.goto();
    await forgot.requestCode(email);

    const verify = new VerifyEmailPage(page);
    await expect(verify.heading).toBeVisible();
    await expect(page).toHaveURL('/forgot-password/verify');
    await expect(page.getByText(sentCopy(email))).toBeVisible();
    const mail = await request.get('/api/__e2e/mail/latest', {
      params: { email, purpose: 'password_reset' },
    });
    expect(mail.ok()).toBe(false);
  });

  // TASK-054 (Q-044, DEC-041): 3 dead reset codes in 24 h pause new ones; the page shows the 429 as returned.
  test('after 3 dead reset codes, Forgot Password shows the shared pause message and no code is sent', async ({
    page,
    request,
    harness,
  }) => {
    const buyer = await harness.seedBuyer({ deadResetCodes: 3 });
    const forgot = new ForgotPasswordPage(page);
    await forgot.goto();
    await forgot.requestCode(buyer.email);

    await expect(forgot.alert).toHaveText(m.api.resetCodesPaused);
    await expect(page).toHaveURL('/forgot-password');
    const mail = await request.get('/api/__e2e/mail/latest', {
      params: { email: buyer.email, purpose: 'password_reset' },
    });
    expect(mail.ok()).toBe(false);
  });
});

test.describe('Validation parity', () => {
  test('Forgot Password shows the shared email messages before any request', async ({ page }) => {
    const noForgotRequest = forbidRequests(page, '/api/auth/password/forgot');
    const forgot = new ForgotPasswordPage(page);
    await forgot.goto();
    await forgot.sendCodeButton.click();
    await expect(forgot.email).toHaveAccessibleDescription(m.email.required);

    const cases = formCases(forgotPasswordCases, ['email']);
    expect(cases.length).toBeGreaterThan(4);
    for (const { name, input, message } of cases) {
      await forgot.requestCode(input.email);
      await expect(forgot.email, name).toHaveAccessibleDescription(message);
    }
    noForgotRequest();
  });

  test('reset Verify: client rules, a wrong code and an early resend show the shared messages', async ({
    page,
    harness,
  }) => {
    const buyer = await harness.seedBuyer();
    const forgot = new ForgotPasswordPage(page);
    await forgot.goto();
    await forgot.requestCode(buyer.email);
    const verify = new VerifyEmailPage(page);
    await expect(verify.heading).toBeVisible();
    const code = await harness.latestCode(buyer.email, 'password_reset');

    const noVerifyRequest = forbidRequests(page, '/api/auth/password/verify');
    await verify.verifyButton.click();
    await expect(verify.code).toHaveAccessibleDescription(m.code.required);
    const tooShort = verifyCodeCases.invalid.find((c) => c.field === 'code' && c.input.code === '12345');
    await verify.verify(tooShort.input.code);
    await expect(verify.code).toHaveAccessibleDescription(tooShort.message);
    noVerifyRequest();

    await verify.verify(code.slice(0, 5) + ((Number(code[5]) + 1) % 10));
    await expect(verify.code).toHaveAccessibleDescription(m.api.codeInvalid);

    // Forgot and Resend share the password_reset cooldown.
    await page.getByRole('button', { name: 'Resend' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    expect(resendTooSoonMessages).toContain(await page.getByRole('alert').textContent());

    await verify.verify(code);
    await expect(new ResetPasswordPage(page).heading).toBeVisible();
  });

  test('Reset password shows the shared password messages before any request', async ({ page, harness }) => {
    const buyer = await harness.seedBuyer();
    const reset = await openResetPassword(page, harness, buyer.email);
    const noResetRequest = forbidRequests(page, '/api/auth/password/reset');

    await reset.resetButton.click();
    await expect(reset.password).toHaveAccessibleDescription(m.password.required);
    await expect(reset.confirmPassword).toHaveAccessibleDescription(m.confirmPassword.required);

    const cases = formCases(resetPasswordCases, ['password', 'confirmPassword']);
    expect(cases.length).toBeGreaterThan(6);
    for (const { name, input, field, message } of cases) {
      await reset.fill({ ...resetPasswordCases.valid, ...input });
      await reset.resetButton.click();
      await expect(reset[field], name).toHaveAccessibleDescription(message);
    }
    noResetRequest();
  });

  test('Reset password shows the API messages: a password rule, then a refused reset token', async ({
    page,
    harness,
  }) => {
    const buyer = await harness.seedBuyer();
    const reset = await openResetPassword(page, harness, buyer.email);

    // A password the client would refuse, sent past it: the message comes from error.fields.password.
    const tooShort = resetPasswordCases.invalid.find((c) => c.input.password === 'abc1234');
    const answers = await sendPastClient(page, '/api/auth/password/reset', (body) => ({
      ...body,
      ...tooShort.input,
    }));
    await reset.reset({ password: NEW_PASSWORD });
    await expect(reset.password).toHaveAccessibleDescription(tooShort.message);
    expect(answers[0].error.fields.password).toContain(tooShort.message);

    // A token the API refuses (401) sends the visitor back to Forgot Password with the shared message.
    await page.unrouteAll();
    await sendPastClient(page, '/api/auth/password/reset', (body) => ({
      ...body,
      resetToken: 'not.a.token',
    }));
    await reset.reset({ password: NEW_PASSWORD });
    const forgot = new ForgotPasswordPage(page);
    await expect(forgot.heading).toBeVisible();
    await expect(forgot.alert).toHaveText(m.resetToken.required);

    // Nothing changed: the old password still works.
    const login = new LoginPage(page);
    await login.goto();
    await login.logIn(buyer);
    await expect(page).toHaveURL('/onboarding/country');
  });
});

// Baselines at the Figma frame width (1440). A fixed email keeps the Verify copy the same on every run.
test.describe('Visual', () => {
  test('Forgot Password, reset Verify and Reset password', async ({ page, harness }) => {
    await harness.seedBuyer({ email: 'visual-reset@example.com' });
    const forgot = new ForgotPasswordPage(page);
    await forgot.goto();
    await expectPageScreenshot(page, 'forgot-password.png');

    await forgot.requestCode('visual-reset@example.com');
    const verify = new VerifyEmailPage(page);
    await expect(verify.heading).toBeVisible();
    await expectPageScreenshot(page, 'verify-reset-code.png');

    await verify.verify(await harness.latestCode('visual-reset@example.com', 'password_reset'));
    await expect(new ResetPasswordPage(page).heading).toBeVisible();
    await expectPageScreenshot(page, 'reset-password.png');
  });
});
