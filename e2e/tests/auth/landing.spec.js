import { professionalInfoCases, signUpCases } from '@real-estate/shared/testing';
import { expect, test, uniqueEmail } from '../../fixtures/harness.js';
import { LoginPage } from '../../pages/auth/LoginPage.page.js';
import { ProfessionalInfoPage } from '../../pages/auth/ProfessionalInfoPage.page.js';
import { SelectCountryPage } from '../../pages/auth/SelectCountryPage.page.js';
import { SignUpPage } from '../../pages/auth/SignUpPage.page.js';
import { UploadDocumentsPage } from '../../pages/auth/UploadDocumentsPage.page.js';
import { VerificationStatusPage } from '../../pages/auth/VerificationStatusPage.page.js';
import { VerifyEmailPage } from '../../pages/auth/VerifyEmailPage.page.js';

// TASK-052: the landing rule of TASK-041 (DEC-039, frontend/src/modules/auth/hooks/landing.js) and the
// session restore of TASK-049 against the real API. An Account resumes onboarding at its first
// unfinished step after Log in or Verify, and an onboarding page opened out of order (including by
// URL, which reloads the app) redirects to that step.

const PATHS = {
  home: '/',
  login: '/login',
  selectCountry: '/onboarding/country',
  professionalInfo: '/developer/professional-info',
  upload: '/developer/documents',
  status: '/developer/status',
};

async function logIn(page, credentials) {
  const login = new LoginPage(page);
  await login.goto();
  await login.logIn(credentials);
}

test.describe('Reload', () => {
  test('a reload on a protected page keeps the session', async ({ page, harness }) => {
    const developer = await harness.seedDeveloper({ documents: 'pending' });
    await logIn(page, developer);
    const status = new VerificationStatusPage(page);
    await expect(status.heading('under_review')).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(PATHS.status);
    await expect(status.heading('under_review')).toBeVisible();
    await expect(status.documents).toHaveCount(2);
  });

  test('with the refresh cookie cleared, a reload goes to Log in with no alert', async ({
    page,
    context,
    harness,
  }) => {
    const buyer = await harness.seedBuyer();
    await logIn(page, buyer);
    await expect(new SelectCountryPage(page).heading).toBeVisible();

    await context.clearCookies();
    await page.reload();
    const login = new LoginPage(page);
    await expect(page).toHaveURL(PATHS.login);
    await expect(login.heading).toBeVisible();
    await expect(login.alert).toHaveCount(0);
  });
});

test.describe('Landing after Log in', () => {
  test('a Buyer without a country goes to Select a country', async ({ page, harness }) => {
    await logIn(page, await harness.seedBuyer());
    await expect(page).toHaveURL(PATHS.selectCountry);
    await expect(new SelectCountryPage(page).heading).toBeVisible();
  });

  test('a Buyer with a country goes home', async ({ page, harness }) => {
    const buyer = await harness.seedBuyer();
    await harness.selectCountry(buyer, 'AE');
    await logIn(page, buyer);
    await expect(page).toHaveURL(PATHS.home);
    await expect(page.getByRole('heading', { name: 'Real Estate' })).toBeVisible();
  });

  test('a Developer without Professional info goes to Professional info', async ({ page, harness }) => {
    await logIn(page, await harness.seedDeveloper({ professionalInfo: false }));
    await expect(page).toHaveURL(PATHS.professionalInfo);
    await expect(new ProfessionalInfoPage(page).heading).toBeVisible();
  });

  test('a Developer with a profile but no documents goes to Upload Document', async ({ page, harness }) => {
    await logIn(page, await harness.seedDeveloper());
    await expect(page).toHaveURL(PATHS.upload);
    await expect(new UploadDocumentsPage(page).heading).toBeVisible();
  });

  test('a Developer with documents pending goes to the status screen (Under Review)', async ({
    page,
    harness,
  }) => {
    await logIn(page, await harness.seedDeveloper({ documents: 'pending' }));
    await expect(page).toHaveURL(PATHS.status);
    await expect(new VerificationStatusPage(page).heading('under_review')).toBeVisible();
  });

  test('a Developer with a rejected document goes to the status screen (Unsuccessful)', async ({
    page,
    harness,
  }) => {
    const developer = await harness.seedDeveloper({
      documents: { government_id: 'rejected', profile_photo: 'approved' },
    });
    await logIn(page, developer);
    await expect(page).toHaveURL(PATHS.status);
    await expect(new VerificationStatusPage(page).heading('unsuccessful')).toBeVisible();
  });

  test('an approved Developer goes home', async ({ page, harness }) => {
    await logIn(page, await harness.seedDeveloper({ documents: 'approved' }));
    await expect(page).toHaveURL(PATHS.home);
    await expect(page.getByRole('heading', { name: 'Real Estate' })).toBeVisible();
  });

  test('a dual-role Account without a profile goes to Professional info', async ({ page, harness }) => {
    const account = await harness.seedBuyer();
    await harness.becomeDeveloper(account);
    await logIn(page, account);
    await expect(page).toHaveURL(PATHS.professionalInfo);
    await expect(new ProfessionalInfoPage(page).heading).toBeVisible();
  });
});

test.describe('Landing after Verify', () => {
  for (const [role, landing, heading] of [
    ['developer', PATHS.professionalInfo, 'Professional Information'],
    ['buyer', PATHS.selectCountry, 'Select a Country'],
  ]) {
    test(`a new ${role} goes to ${heading}`, async ({ page, harness }) => {
      const email = uniqueEmail(role);
      const signUp = new SignUpPage(page);
      await signUp.goto(role);
      await signUp.fill({ ...signUpCases.valid, email });
      await signUp.submit();
      const verify = new VerifyEmailPage(page);
      await expect(verify.heading).toBeVisible();
      await verify.verify(await harness.latestCode(email, 'email_verification'));
      await expect(page).toHaveURL(landing);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    });
  }
});

test.describe('Out of order', () => {
  test('Upload Document with no profile redirects to Professional info', async ({ page, harness }) => {
    await logIn(page, await harness.seedDeveloper({ professionalInfo: false }));
    await expect(page).toHaveURL(PATHS.professionalInfo);

    await page.goto(PATHS.upload);
    await expect(page).toHaveURL(PATHS.professionalInfo);
    await expect(new ProfessionalInfoPage(page).heading).toBeVisible();
  });

  test('the status screen with a document missing redirects to Upload Document', async ({
    page,
    harness,
  }) => {
    // Only the Government ID was sent; the Profile Photo is still missing.
    await logIn(page, await harness.seedDeveloper({ documents: { government_id: 'pending' } }));
    const upload = new UploadDocumentsPage(page);
    await expect(page).toHaveURL(PATHS.upload);

    await page.goto(PATHS.status);
    await expect(page).toHaveURL(PATHS.upload);
    await expect(upload.heading).toBeVisible();
    await expect(upload.slots).toHaveCount(1);
    await expect(upload.slot('profile_photo')).toBeVisible();
  });

  test('the status screen opened directly with no profile ends on Professional info', async ({
    page,
    harness,
  }) => {
    const developer = await harness.seedDeveloper({ professionalInfo: false });
    // Signed out: the protected page sends the visitor to Log in, which then applies the landing rule.
    await page.goto(PATHS.status);
    await expect(page).toHaveURL(PATHS.login);
    await new LoginPage(page).logIn(developer);
    await expect(page).toHaveURL(PATHS.professionalInfo);

    // Signed in: opening it by URL restores the session, then the guard redirects.
    await page.goto(PATHS.status);
    await expect(page).toHaveURL(PATHS.professionalInfo);
    await expect(new ProfessionalInfoPage(page).heading).toBeVisible();
  });

  // Regression check (TASK-041 gotcha): Log in caches the 403 "no Professional info" of
  // GET /me/verification; the Upload Document guard must not act on it after Professional info is saved.
  test('after Professional info, Next keeps Upload Document open', async ({ page, harness }) => {
    await logIn(page, await harness.seedDeveloper({ professionalInfo: false }));
    const info = new ProfessionalInfoPage(page);
    await expect(info.heading).toBeVisible();
    await info.fill({ ...professionalInfoCases.valid, developerType: 'individual', companyName: '' });

    const verificationLoaded = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/auth/me/verification',
    );
    await info.submit();
    const upload = new UploadDocumentsPage(page);
    await expect(upload.heading).toBeVisible();
    expect((await verificationLoaded).status()).toBe(200);
    await expect(page).toHaveURL(PATHS.upload);
    await expect(upload.slots).toHaveCount(2);
  });
});
