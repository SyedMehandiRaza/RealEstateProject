import { signUpCases } from '@real-estate/shared/testing';
import { expect, test, uniqueEmail } from '../fixtures/harness.js';
import { SignUpPage } from '../pages/auth/SignUpPage.page.js';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage.page.js';

// Smoke test of the e2e harness (TASK-042): the e2e API is the one answering, codes are captured instead
// of emailed, and seeded Accounts are what the real API sees.

test.describe('e2e harness', () => {
  test('the app talks to the e2e API on the test database', async ({ harness }) => {
    expect(await harness.status()).toEqual({ mode: 'e2e', database: 'real_estate_test' });
  });

  test('sign up, read the captured code, verify', async ({ page, harness }) => {
    const email = uniqueEmail('buyer');
    const signUp = new SignUpPage(page);
    await signUp.goto();
    await signUp.fill({ ...signUpCases.valid, email });
    await signUp.submit();

    const verify = new VerifyEmailPage(page);
    await expect(verify.heading).toBeVisible();
    await verify.verify(await harness.latestCode(email, 'email_verification'));

    // A verified Buyer lands on Select a country, signed in.
    await expect(page).toHaveURL('/onboarding/country');
    await expect(page.getByRole('heading', { name: 'Select a Country' })).toBeVisible();
    expect(await harness.storageCalls()).toEqual([]);
  });

  test('seeded Accounts and review decisions are what the API reports', async ({ request, harness }) => {
    const buyer = await harness.seedBuyer();
    const login = await request.post('/api/auth/login', {
      data: { email: buyer.email, password: buyer.password },
    });
    expect(login.status()).toBe(200);

    const developer = await harness.seedDeveloper({ documents: 'pending' });
    const statusAfterLogin = async () => {
      const res = await request.post('/api/auth/login', {
        data: { email: developer.email, password: developer.password },
      });
      return (await res.json()).data.user.developerVerificationStatus;
    };
    expect(await statusAfterLogin()).toBe('under_review');

    await harness.setDocumentReview({
      email: developer.email,
      documentKind: 'profile_photo',
      status: 'rejected',
    });
    expect(await statusAfterLogin()).toBe('unsuccessful');

    await harness.setDocumentReview({ email: developer.email, status: 'approved' });
    expect(await statusAfterLogin()).toBe('active');
  });
});
