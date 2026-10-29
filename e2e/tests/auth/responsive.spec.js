import { professionalInfoCases, signUpCases } from '@real-estate/shared/testing';
import { expect, test } from '../../fixtures/harness.js';
import { expectResponsiveScreenshots } from '../../fixtures/visual.js';
import { ForgotPasswordPage } from '../../pages/auth/ForgotPasswordPage.page.js';
import { LoginPage } from '../../pages/auth/LoginPage.page.js';
import { ProfessionalInfoPage } from '../../pages/auth/ProfessionalInfoPage.page.js';
import { ResetPasswordPage } from '../../pages/auth/ResetPasswordPage.page.js';
import { SelectCountryPage } from '../../pages/auth/SelectCountryPage.page.js';
import { SignUpPage } from '../../pages/auth/SignUpPage.page.js';
import { UploadDocumentsPage } from '../../pages/auth/UploadDocumentsPage.page.js';
import { VerificationStatusPage } from '../../pages/auth/VerificationStatusPage.page.js';
import { VerifyEmailPage } from '../../pages/auth/VerifyEmailPage.page.js';

// TASK-052: every auth page at 1366x768 and 375x812 (TASK-051, DEC-039 "Responsive rule" in
// docs/modules/auth/figma.md): a baseline each and no horizontal scroll. The 1440 baselines stay in the
// journey specs. The email in the Verify copy is masked (it is the only text that depends on the data).

async function logIn(page, credentials, landing) {
  const login = new LoginPage(page);
  await login.goto();
  await login.logIn(credentials);
  await expect(page).toHaveURL(landing);
}

const sentCopy = (page) => page.getByText(/^We’ve sent a \d-digit code to /);

test.describe('Responsive', () => {
  test('Log in', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.heading).toBeVisible();
    await expectResponsiveScreenshots(page, 'login');
  });

  test('Sign up, Buyer and Developers tabs', async ({ page }) => {
    const signUp = new SignUpPage(page);
    await signUp.goto();
    await expect(signUp.submitButton).toBeVisible();
    await expectResponsiveScreenshots(page, 'sign-up-buyer');
    await signUp.goto('developer');
    await expect(signUp.submitButton).toBeVisible();
    await expectResponsiveScreenshots(page, 'sign-up-developer');
  });

  test('Verify (email)', async ({ page }) => {
    const signUp = new SignUpPage(page);
    await signUp.goto();
    await signUp.fill({ ...signUpCases.valid, email: 'visual-buyer@example.com' });
    await signUp.submit();
    await expect(new VerifyEmailPage(page).heading).toBeVisible();
    await expectResponsiveScreenshots(page, 'verify-email', { mask: [sentCopy(page)] });
  });

  test('Forgot Password, reset Verify and Reset password', async ({ page, harness }) => {
    const email = 'visual-reset@example.com';
    await harness.seedBuyer({ email });
    const forgot = new ForgotPasswordPage(page);
    await forgot.goto();
    await expect(forgot.heading).toBeVisible();
    await expectResponsiveScreenshots(page, 'forgot-password');

    await forgot.requestCode(email);
    const verify = new VerifyEmailPage(page);
    await expect(verify.heading).toBeVisible();
    await expectResponsiveScreenshots(page, 'verify-reset-code', { mask: [sentCopy(page)] });

    await verify.verify(await harness.latestCode(email, 'password_reset'));
    await expect(new ResetPasswordPage(page).heading).toBeVisible();
    await expectResponsiveScreenshots(page, 'reset-password');
  });

  test('Select a country', async ({ page, harness }) => {
    await logIn(page, await harness.seedBuyer(), '/onboarding/country');
    await expect(new SelectCountryPage(page).heading).toBeVisible();
    await expectResponsiveScreenshots(page, 'select-country');
  });

  test('Professional info and Upload Document (empty and with files)', async ({ page, harness }) => {
    await logIn(
      page,
      await harness.seedDeveloper({ professionalInfo: false }),
      '/developer/professional-info',
    );
    const info = new ProfessionalInfoPage(page);
    await expect(info.heading).toBeVisible();
    await expectResponsiveScreenshots(page, 'professional-info');

    await info.fill({ ...professionalInfoCases.valid, developerType: 'individual', companyName: '' });
    await info.submit();
    const upload = new UploadDocumentsPage(page);
    await expect(upload.slots).toHaveCount(2);
    await expectResponsiveScreenshots(page, 'upload-documents');

    await upload.chooseIdType('passport');
    await upload.pick('government_id', 'passport.pdf');
    await upload.pick('profile_photo', 'photo.png');
    await expect(page.getByRole('button', { name: 'Remove photo.png' })).toBeVisible();
    await expectResponsiveScreenshots(page, 'upload-documents-uploaded');
  });

  for (const [outcome, documents, name] of [
    ['under_review', 'pending', 'status-pending'],
    ['active', 'approved', 'status-approved'],
    ['unsuccessful', { government_id: 'rejected', profile_photo: 'approved' }, 'status-reject'],
  ]) {
    test(`status screen: ${name}`, async ({ page, harness }) => {
      // Active lands home (then opens the status screen by URL); the others land on the status screen.
      const landing = outcome === 'active' ? '/' : '/developer/status';
      await logIn(page, await harness.seedDeveloper({ documents }), landing);
      if (landing !== '/developer/status') await page.goto('/developer/status');
      const status = new VerificationStatusPage(page);
      await expect(status.heading(outcome)).toBeVisible();
      await expect(status.documents).toHaveCount(2);
      await expectResponsiveScreenshots(page, name);
    });
  }
});
