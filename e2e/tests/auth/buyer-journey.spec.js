import { authMessages, LIMITS } from '@real-estate/shared';
import { loginCases, selectCountryCases, signUpCases, verifyCodeCases } from '@real-estate/shared/testing';
import { expect, test, uniqueEmail } from '../../fixtures/harness.js';
import { forbidRequests, formCases, sendPastClient } from '../../fixtures/parity.js';
import { expectPageScreenshot } from '../../fixtures/visual.js';
import { LoginPage } from '../../pages/auth/LoginPage.page.js';
import { SelectCountryPage } from '../../pages/auth/SelectCountryPage.page.js';
import { SignUpPage } from '../../pages/auth/SignUpPage.page.js';
import { VerifyEmailPage } from '../../pages/auth/VerifyEmailPage.page.js';

// TASK-043: the Buyer journey against the real API (e2e start mode, DEC-036): Sign up, Verify, Select a
// country and Log in, with validation parity (each on-screen message is the shared constant) and the
// visual baselines of those pages. Also the real-browser check of TASK-046: two pages refreshing at once.

const m = authMessages;

async function noTokenInBrowserStorage(page) {
  const stored = await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]);
  expect(stored).toEqual([[], []]);
}

const resendTooSoonMessages = Array.from({ length: 60 }, (_, i) => m.api.resendTooSoon(i + 1));

test.describe('Buyer journey', () => {
  test('sign up, verify with the emailed code, select a country, then log in again', async ({
    page,
    harness,
  }) => {
    const email = uniqueEmail('buyer');
    const { password } = signUpCases.valid;

    const signUp = new SignUpPage(page);
    await signUp.goto();
    await signUp.fill({ ...signUpCases.valid, email });
    await signUp.submit();

    const verify = new VerifyEmailPage(page);
    await expect(verify.heading).toBeVisible();
    await expect(
      page.getByText(`We’ve sent a ${LIMITS.auth.codeLength}-digit code to ${email}.`),
    ).toBeVisible();
    await verify.verify(await harness.latestCode(email, 'email_verification'));

    const country = new SelectCountryPage(page);
    await expect(page).toHaveURL('/onboarding/country');
    await expect(country.heading).toBeVisible();
    await country.choose('United Arab Emirates');
    await expect(country.country('United Arab Emirates')).toBeChecked();
    await country.submit();
    await expect(page).toHaveURL('/');
    await noTokenInBrowserStorage(page);

    // Log in (TASK-033, built against MSW) with the real API: the saved country comes back selected.
    const login = new LoginPage(page);
    await login.goto();
    await login.logIn({ email, password });
    await expect(page).toHaveURL('/onboarding/country');
    await expect(country.country('United Arab Emirates')).toBeChecked();
    await noTokenInBrowserStorage(page);
  });

  test('log in as a seeded Buyer; a wrong password shows invalidCredentials', async ({ page, harness }) => {
    const buyer = await harness.seedBuyer();
    const login = new LoginPage(page);
    await login.goto();

    await login.logIn({ email: buyer.email, password: 'wrong-password1' });
    await expect(login.alert).toHaveText(m.api.invalidCredentials);
    // An unknown email answers the same.
    await login.logIn({ email: 'nobody@example.com', password: buyer.password });
    await expect(login.alert).toHaveText(m.api.invalidCredentials);
    await expect(page).toHaveURL('/login');

    await login.logIn({ email: buyer.email, password: buyer.password });
    await expect(page).toHaveURL('/onboarding/country');
    await expect(new SelectCountryPage(page).heading).toBeVisible();
    await noTokenInBrowserStorage(page);
  });

  test('an unverified Account that logs in is sent to Verify with a new code', async ({ page, harness }) => {
    const buyer = await harness.seedBuyer({ verified: false });
    const login = new LoginPage(page);
    await login.goto();
    await login.logIn(buyer);

    const verify = new VerifyEmailPage(page);
    await expect(verify.heading).toBeVisible();
    await expect(page).toHaveURL('/verify-email');
    await verify.verify(await harness.latestCode(buyer.email, 'email_verification'));
    await expect(page).toHaveURL('/onboarding/country');
  });

  // TASK-046 in a real browser: two pages of one browser share the refresh cookie. When both need a new
  // access token at the same moment, the Web Lock makes them refresh one after the other, so the second
  // presents the rotated cookie instead of reusing the old one (which would log the Account out
  // everywhere, Q-038, DEC-028).
  test('two pages refreshing at once keep the Account signed in', async ({ context, harness }) => {
    const buyer = await harness.seedBuyer();
    const pages = [await context.newPage(), await context.newPage()];
    for (const page of pages) {
      const login = new LoginPage(page);
      await login.goto();
      await login.logIn(buyer);
      await expect(page).toHaveURL('/onboarding/country');
    }

    const refreshes = [];
    context.on('response', (response) => {
      if (new URL(response.url()).pathname === '/api/auth/refresh') refreshes.push(response.status());
    });

    // Each page's first PUT /me/country goes to the real API with a stale access token, so it answers
    // 401 and the page refreshes. Both 401s are held until both have arrived, so the two pages start
    // their refresh at the same moment.
    let releaseBoth;
    const bothExpired = new Promise((resolve) => {
      releaseBoth = resolve;
    });
    let expired = 0;
    for (const page of pages) {
      let tampered = false;
      await page.route('**/api/auth/me/country', async (route) => {
        if (tampered) return route.continue();
        tampered = true;
        const response = await route.fetch({
          headers: { ...route.request().headers(), authorization: 'Bearer expired.access.token' },
        });
        expect(response.status()).toBe(401);
        expired += 1;
        if (expired === pages.length) releaseBoth();
        await bothExpired;
        return route.fulfill({ response });
      });
      await new SelectCountryPage(page).choose('Singapore');
    }

    await Promise.all(pages.map((page) => new SelectCountryPage(page).submit()));
    for (const page of pages) await expect(page).toHaveURL('/');
    expect(refreshes).toEqual([200, 200]);

    // The cookie the browser holds now is still a live session.
    const refresh = await context.request.post('/api/auth/refresh');
    expect(refresh.status()).toBe(200);
  });
});

test.describe('Validation parity', () => {
  const signUpFields = ['fullName', 'email', 'phone', 'password', 'confirmPassword'];

  test('Sign up shows the shared message for every invalid field, before any request', async ({ page }) => {
    const noSignUpRequest = forbidRequests(page, '/api/auth/sign-up');
    const signUp = new SignUpPage(page);
    await signUp.goto();

    // Nothing typed: every field shows its required message.
    await signUp.submit();
    await expect(signUp.fullName).toHaveAccessibleDescription(m.fullName.required);
    await expect(signUp.email).toHaveAccessibleDescription(m.email.required);
    await expect(signUp.phone).toHaveAccessibleDescription(m.phone.required);
    await expect(signUp.password).toHaveAccessibleDescription(m.password.required);
    await expect(signUp.confirmPassword).toHaveAccessibleDescription(m.confirmPassword.required);

    const cases = formCases(signUpCases, signUpFields);
    expect(cases.length).toBeGreaterThan(15);
    for (const { name, input, field, message } of cases) {
      await signUp.fill({ ...signUpCases.valid, ...input });
      await signUp.submit();
      await expect(signUp[field], name).toHaveAccessibleDescription(message);
    }
    noSignUpRequest();
  });

  test('Sign up with a registered email shows emailTaken from the API', async ({ page, harness }) => {
    const buyer = await harness.seedBuyer();
    const signUp = new SignUpPage(page);
    await signUp.goto();
    await signUp.fill({ ...signUpCases.valid, email: buyer.email });
    await signUp.submit();
    await expect(signUp.email).toHaveAccessibleDescription(m.api.emailTaken);
    await expect(page).toHaveURL('/sign-up');
  });

  test('Verify: client rules, a wrong code and an early resend show the shared messages', async ({
    page,
    harness,
  }) => {
    const email = uniqueEmail('buyer');
    const signUp = new SignUpPage(page);
    await signUp.goto();
    await signUp.fill({ ...signUpCases.valid, email });
    await signUp.submit();
    const verify = new VerifyEmailPage(page);
    await expect(verify.heading).toBeVisible();
    const code = await harness.latestCode(email, 'email_verification');

    const noVerifyRequest = forbidRequests(page, '/api/auth/verify-email');
    await verify.verifyButton.click();
    await expect(verify.code).toHaveAccessibleDescription(m.code.required);
    const tooShort = verifyCodeCases.invalid.find((c) => c.field === 'code' && c.input.code === '12345');
    await verify.verify(tooShort.input.code);
    await expect(verify.code).toHaveAccessibleDescription(tooShort.message);
    noVerifyRequest();

    // Server rules: a code that is not the one emailed, and Resend inside the 60 s cooldown.
    const wrongCode = code.slice(0, 5) + ((Number(code[5]) + 1) % 10);
    await verify.verify(wrongCode);
    await expect(verify.code).toHaveAccessibleDescription(m.api.codeInvalid);

    await page.getByRole('button', { name: 'Resend' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    expect(resendTooSoonMessages).toContain(await page.getByRole('alert').textContent());

    await verify.verify(code);
    await expect(page).toHaveURL('/onboarding/country');
  });

  test('Log in shows the shared message for every invalid field, before any request', async ({ page }) => {
    const noLoginRequest = forbidRequests(page, '/api/auth/login');
    const login = new LoginPage(page);
    await login.goto();
    await login.submit();
    await expect(login.email).toHaveAccessibleDescription(m.email.required);
    await expect(login.password).toHaveAccessibleDescription(m.password.required);

    const cases = formCases(loginCases, ['email', 'password']);
    expect(cases.length).toBeGreaterThan(4);
    for (const { name, input, field, message } of cases) {
      await login.fill({ ...loginCases.valid, ...input });
      await login.submit();
      await expect(login[field], name).toHaveAccessibleDescription(message);
    }
    noLoginRequest();
  });

  test('Select a country: none chosen, and a code the API refuses, show countryCode.invalid', async ({
    page,
    harness,
  }) => {
    const buyer = await harness.seedBuyer();
    const login = new LoginPage(page);
    await login.goto();
    await login.logIn(buyer);
    const country = new SelectCountryPage(page);
    await expect(country.heading).toBeVisible();

    const noCountryRequest = forbidRequests(page, '/api/auth/me/country');
    await country.submit();
    await expect(country.countries).toHaveAccessibleDescription(m.countryCode.invalid);
    noCountryRequest();

    // Bypass the client: the chosen country goes out as a code outside COUNTRY_CODES, so the message on
    // screen is the one the API returned in error.fields.countryCode.
    const refused = selectCountryCases.invalid.find((c) => c.input.countryCode === 'IN');
    const answers = await sendPastClient(page, '/api/auth/me/country', refused.input);
    await country.choose('United States');
    await country.submit();
    await expect(country.countries).toHaveAccessibleDescription(refused.message);
    expect(answers[0].error.fields.countryCode).toContain(refused.message);
    await expect(page).toHaveURL('/onboarding/country');
  });
});

// Baselines at the Figma frame width (1440). Fixed emails keep the Verify copy the same on every run.
test.describe('Visual', () => {
  test('Log in', async ({ page }) => {
    await new LoginPage(page).goto();
    await expectPageScreenshot(page, 'login.png');
  });

  test('Sign up, Buyer and Developers tabs', async ({ page }) => {
    const signUp = new SignUpPage(page);
    await signUp.goto();
    await expectPageScreenshot(page, 'sign-up-buyer.png');
    await signUp.goto('developer');
    await expectPageScreenshot(page, 'sign-up-developer.png');
  });

  test('Verify (email)', async ({ page }) => {
    const signUp = new SignUpPage(page);
    await signUp.goto();
    await signUp.fill({ ...signUpCases.valid, email: 'visual-buyer@example.com' });
    await signUp.submit();
    await expect(new VerifyEmailPage(page).heading).toBeVisible();
    await expectPageScreenshot(page, 'verify-email.png');
  });

  test('Select a country', async ({ page, harness }) => {
    const buyer = await harness.seedBuyer();
    const login = new LoginPage(page);
    await login.goto();
    await login.logIn(buyer);
    await expect(new SelectCountryPage(page).heading).toBeVisible();
    await expectPageScreenshot(page, 'select-country.png');
  });
});
