import { readFileSync } from 'node:fs';
import { authMessages, LIMITS } from '@real-estate/shared';
import { professionalInfoCases, signUpCases } from '@real-estate/shared/testing';
import { expect, test } from '../../fixtures/harness.js';
import { openInApp } from '../../fixtures/navigation.js';
import { forbidRequests, formCases, sendPastClient } from '../../fixtures/parity.js';
import { expectPageScreenshot } from '../../fixtures/visual.js';
import { LoginPage } from '../../pages/auth/LoginPage.page.js';
import { ProfessionalInfoPage } from '../../pages/auth/ProfessionalInfoPage.page.js';
import { SignUpPage } from '../../pages/auth/SignUpPage.page.js';
import { fixtureFile, UploadDocumentsPage } from '../../pages/auth/UploadDocumentsPage.page.js';
import { VerificationStatusPage } from '../../pages/auth/VerificationStatusPage.page.js';
import { VerifyEmailPage } from '../../pages/auth/VerifyEmailPage.page.js';

// TASK-045: Developer onboarding against the real API (e2e start mode, DEC-036): Sign up (Developers tab)
// -> Verify -> Professional info -> Upload Document (real PDF/PNG fixtures through the fake storage) ->
// Pending; seeded review decisions -> Approved, and Reject -> resubmit only the rejected kind. With
// validation parity (on-screen messages are the shared constants) and the visual baselines.

const m = authMessages;
const INDIVIDUAL = { ...professionalInfoCases.valid, developerType: 'individual', companyName: '' };
const COMPANY = professionalInfoCases.valid;

async function signUpDeveloper(page, harness, email) {
  const signUp = new SignUpPage(page);
  await signUp.goto('developer');
  await signUp.fill({ ...signUpCases.valid, role: 'developer', email });
  await signUp.submit();
  const verify = new VerifyEmailPage(page);
  await expect(verify.heading).toBeVisible();
  await verify.verify(await harness.latestCode(email, 'email_verification'));
  await expect(page).toHaveURL('/developer/professional-info');
}

// Log in lands every Developer on Professional info until post-login routing exists (TASK-041), so the
// spec then opens the screen it needs inside the app (a reload would end the in-memory session).
async function logInAndOpen(page, credentials, path) {
  const login = new LoginPage(page);
  await login.goto();
  await login.logIn(credentials);
  await expect(page).toHaveURL('/developer/professional-info');
  if (path) await openInApp(page, path);
}

const uploads = (calls) => calls.filter(([operation]) => operation === 'upload');

test.describe('Developer onboarding', () => {
  test('Individual: professional info, two documents, Pending, then approval shows Approved', async ({
    page,
    harness,
  }) => {
    const email = 'dev-individual@example.com';
    const { password } = signUpCases.valid;
    await signUpDeveloper(page, harness, email);

    const info = new ProfessionalInfoPage(page);
    await expect(info.heading).toBeVisible();
    await info.fill(INDIVIDUAL);
    await info.submit();

    const upload = new UploadDocumentsPage(page);
    await expect(upload.heading).toBeVisible();
    await expect(upload.slots).toHaveCount(2);
    await upload.chooseIdType('passport');
    await upload.pick('government_id', 'passport.pdf');
    await upload.pick('profile_photo', 'photo.png');
    await expect(page.getByRole('button', { name: 'Remove passport.pdf' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove photo.png' })).toBeVisible();
    await upload.submit();

    const status = new VerificationStatusPage(page);
    await expect(status.heading('under_review')).toBeVisible();
    await expect(status.documents).toHaveCount(2);
    await expect(status.document('passport.pdf')).toContainText('Pending');
    await expect(status.document('photo.png')).toContainText('Pending');
    // Both files went to the fake storage, none to Cloudinary.
    expect(uploads(await harness.storageCalls())).toHaveLength(2);

    await status.backToLoginButton.click();
    await expect(page).toHaveURL('/login');

    await harness.setDocumentReview({ email, status: 'approved' });
    await logInAndOpen(page, { email, password }, '/developer/status');
    await expect(status.heading('active')).toBeVisible();
    await expect(status.document('passport.pdf')).toContainText('Approved');
    await expect(status.document('photo.png')).toContainText('Approved');
    await status.viewPlanButton.click();
    await expect(page.getByRole('heading', { name: 'Plans coming soon' })).toBeVisible();
  });

  test('Company: three documents; a rejected Government ID shows Reject and is resubmitted alone', async ({
    page,
    harness,
  }) => {
    const email = 'dev-company@example.com';
    const { password } = signUpCases.valid;
    await signUpDeveloper(page, harness, email);

    const info = new ProfessionalInfoPage(page);
    await info.fill(COMPANY);
    await info.submit();

    const upload = new UploadDocumentsPage(page);
    await expect(upload.heading).toBeVisible();
    await expect(upload.slots).toHaveCount(3);
    await upload.chooseIdType('driving_license');
    await upload.pick('government_id', 'passport.pdf');
    await upload.pick('company_registration_certificate', 'certificate.pdf');
    await upload.pick('profile_photo', 'photo.png');
    await upload.submit();

    const status = new VerificationStatusPage(page);
    await expect(status.heading('under_review')).toBeVisible();
    await expect(status.documents).toHaveCount(3);
    await status.backToLoginButton.click();
    await expect(page).toHaveURL('/login');

    const rejectionReason = 'The ID photo is blurred';
    await harness.setDocumentReview({ email, status: 'approved' });
    await harness.setDocumentReview({
      email,
      documentKind: 'government_id',
      status: 'rejected',
      rejectionReason,
    });
    await logInAndOpen(page, { email, password }, '/developer/status');
    await expect(status.heading('unsuccessful')).toBeVisible();
    await expect(status.document('passport.pdf')).toContainText('Reject');
    await expect(status.document('passport.pdf')).toContainText(`Reject reason: ${rejectionReason}`);
    await expect(status.document('certificate.pdf')).toContainText('Approved');
    await expect(status.document('photo.png')).toContainText('Approved');

    // Resubmit opens Upload Document with only the rejected kind.
    await status.resubmitButton.click();
    await expect(upload.heading).toBeVisible();
    await expect(upload.slots).toHaveCount(1);
    await expect(upload.slot('government_id')).toBeVisible();
    await upload.chooseIdType('passport');
    await upload.pick('government_id', 'passport.pdf');
    await upload.submit();

    await expect(status.heading('under_review')).toBeVisible();
    await expect(status.document('passport.pdf')).toContainText('Pending');
    await expect(status.document('certificate.pdf')).toContainText('Approved');
    await expect(status.document('photo.png')).toContainText('Approved');
    // Three first uploads plus the resubmitted one; the rejected file is kept as history.
    const calls = await harness.storageCalls();
    expect(uploads(calls)).toHaveLength(4);
    expect(calls.filter(([operation]) => operation === 'destroy')).toEqual([]);
  });
});

test.describe('Validation parity', () => {
  test('Professional info shows the shared messages before any request', async ({ page, harness }) => {
    const developer = await harness.seedDeveloper({ professionalInfo: false });
    await logInAndOpen(page, developer);
    const noSaveRequest = forbidRequests(page, '/api/auth/me/professional-profile');
    const info = new ProfessionalInfoPage(page);

    await info.submit();
    await expect(info.developerType).toHaveAccessibleDescription(m.developerType.invalid);
    await expect(info.licenseNumber).toHaveAccessibleDescription(m.licenseNumber.required);
    await expect(info.experienceLevel).toHaveAccessibleDescription(m.experienceLevel.invalid);
    await expect(info.location).toHaveAccessibleDescription(m.location.required);

    // The dropdowns are chosen once (Company, so Company Name is required); the text cases replay.
    await info.fill(COMPANY);
    const cases = formCases(professionalInfoCases, ['companyName', 'licenseNumber', 'location']);
    expect(cases.length).toBeGreaterThan(8);
    for (const { name, input, field, message } of cases) {
      await info.fill({ ...COMPANY, ...input, developerType: undefined, experienceLevel: undefined });
      await info.submit();
      await expect(info[field], name).toHaveAccessibleDescription(message);
    }
    noSaveRequest();
  });

  test('Professional info: a Company without a name, sent past the client, shows the API message', async ({
    page,
    harness,
  }) => {
    const developer = await harness.seedDeveloper({ professionalInfo: false });
    await logInAndOpen(page, developer);
    const answers = await sendPastClient(
      page,
      '/api/auth/me/professional-profile',
      ({ companyName: _companyName, ...body }) => ({ ...body, developerType: 'company' }),
    );
    const info = new ProfessionalInfoPage(page);
    await info.fill(COMPANY);
    await info.submit();
    await expect(info.companyName).toHaveAccessibleDescription(m.companyName.required);
    expect(answers[0].error.fields.companyName).toContain(m.companyName.required);
    await expect(page).toHaveURL('/developer/professional-info');
  });

  test('Upload Document: wrong type, over 10 MB, a PDF photo and a missing ID type, before any request', async ({
    page,
    harness,
  }) => {
    const developer = await harness.seedDeveloper();
    await logInAndOpen(page, developer, '/developer/documents');
    const upload = new UploadDocumentsPage(page);
    await expect(upload.heading).toBeVisible();
    const noUploadRequest = forbidRequests(page, '/api/auth/me/documents');

    await upload.pick('government_id', {
      name: 'id.gif',
      mimeType: 'image/gif',
      buffer: Buffer.from('GIF89a'),
    });
    await expect(upload.fileInput('government_id')).toHaveAccessibleDescription(m.mimeType.invalid);
    await upload.pick('government_id', {
      name: 'big.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(LIMITS.auth.maxFileBytes + 1),
    });
    await expect(upload.fileInput('government_id')).toHaveAccessibleDescription(m.sizeBytes.max);
    await upload.pick('profile_photo', 'passport.pdf');
    await expect(upload.fileInput('profile_photo')).toHaveAccessibleDescription(m.mimeType.photo);

    // Both files accepted, but no Government ID type chosen.
    await upload.pick('government_id', 'passport.pdf');
    await upload.pick('profile_photo', 'photo.png');
    await upload.submit();
    await expect(upload.idTypeSelect()).toHaveAccessibleDescription(m.idDocumentType.required);
    noUploadRequest();
    expect(await harness.storageCalls()).toEqual([]);
  });

  test('Upload Document: a PNG named and typed as a PDF is refused by the API on its slot', async ({
    page,
    harness,
  }) => {
    const developer = await harness.seedDeveloper();
    await logInAndOpen(page, developer, '/developer/documents');
    const upload = new UploadDocumentsPage(page);
    await expect(upload.heading).toBeVisible();

    // The client sees a PDF by name and type; the server sniffs the bytes (DEC-034).
    await upload.chooseIdType('passport');
    await upload.pick('government_id', {
      name: 'passport.pdf',
      mimeType: 'application/pdf',
      buffer: readFileSync(fixtureFile('photo.png')),
    });
    await upload.pick('profile_photo', 'photo.png');
    await upload.submit();
    await expect(upload.slot('government_id')).toHaveAccessibleDescription(m.mimeType.invalid);
    await expect(page).toHaveURL('/developer/documents');
    expect(await harness.storageCalls()).toEqual([]);
  });
});

// Baselines at the Figma frame width (1440). Seeded documents have fixed names and sizes.
test.describe('Visual', () => {
  test('Professional info and Upload Document (empty and with files)', async ({ page, harness }) => {
    const developer = await harness.seedDeveloper({ professionalInfo: false });
    await logInAndOpen(page, developer);
    const info = new ProfessionalInfoPage(page);
    await expect(info.heading).toBeVisible();
    await expectPageScreenshot(page, 'professional-info.png');

    await info.fill(INDIVIDUAL);
    await info.submit();
    const upload = new UploadDocumentsPage(page);
    await expect(upload.slots).toHaveCount(2);
    await expectPageScreenshot(page, 'upload-documents.png');

    await upload.chooseIdType('passport');
    await upload.pick('government_id', 'passport.pdf');
    await upload.pick('profile_photo', 'photo.png');
    await expect(page.getByRole('button', { name: 'Remove photo.png' })).toBeVisible();
    await expectPageScreenshot(page, 'upload-documents-uploaded.png');
  });

  for (const [outcome, documents, name] of [
    ['under_review', 'pending', 'status-pending.png'],
    ['active', 'approved', 'status-approved.png'],
    ['unsuccessful', { government_id: 'rejected', profile_photo: 'approved' }, 'status-reject.png'],
  ]) {
    test(`status screen: ${name}`, async ({ page, harness }) => {
      const developer = await harness.seedDeveloper({ documents });
      await logInAndOpen(page, developer, '/developer/status');
      const status = new VerificationStatusPage(page);
      await expect(status.heading(outcome)).toBeVisible();
      await expect(status.documents).toHaveCount(2);
      await expectPageScreenshot(page, name);
    });
  }
});
