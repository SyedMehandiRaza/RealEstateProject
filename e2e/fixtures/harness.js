import { test as base, expect } from '@playwright/test';
import { withApi } from '../playwright.config.js';

// The e2e harness (TASK-042, DEC-036). Specs that need the API import { test, expect } from here:
// - every test starts from an empty real_estate_test (and fresh rate limits, mail and storage), and is
//   skipped when the suite runs UI-only (E2E_WITH_API=false);
// - the `harness` fixture reads captured codes and seeds data through the e2e server's test-only
//   /api/__e2e routes (served only in the e2e start mode, through the Vite proxy like the app's calls).
// UI-only specs keep importing from @playwright/test.

const BASE = '/api/__e2e';

async function dataOf(response) {
  if (!response.ok()) {
    throw new Error(`${response.url()} answered ${response.status()}: ${await response.text()}`);
  }
  return response.status() === 204 ? undefined : (await response.json()).data;
}

let emails = 0;
// A fresh address per call, for forms that create an Account.
export const uniqueEmail = (label = 'user') => `e2e-${label}-${Date.now()}-${(emails += 1)}@example.com`;

export function createHarness(request) {
  return {
    status: () => request.get(`${BASE}/status`).then(dataOf),
    reset: () => request.post(`${BASE}/reset`).then(dataOf),

    // The newest code emailed to `email` (purpose 'email_verification' or 'password_reset'), waiting
    // briefly for it to arrive.
    async latestCode(email, purpose) {
      let code;
      await expect
        .poll(
          async () => {
            const res = await request.get(`${BASE}/mail/latest`, {
              params: { email, ...(purpose && { purpose }) },
            });
            code = res.ok() ? (await res.json()).data.code : undefined;
            return code;
          },
          { message: `a ${purpose ?? 'verification'} code emailed to ${email}`, timeout: 5_000 },
        )
        .toMatch(/^\d{6}$/);
      return code;
    },

    // Seeds an Account straight into the database; see backend/src/test/e2eSeeds.js for the options.
    // Returns { id, email, password, roles, professionalProfileId, documents }.
    seedAccount: (options = {}) => request.post(`${BASE}/seed/accounts`, { data: options }).then(dataOf),
    // A verified Buyer.
    seedBuyer(options = {}) {
      return this.seedAccount({ ...options, role: 'buyer' });
    },
    // A verified Developer. By Verification status:
    //   before Professional info  { professionalInfo: false }
    //   Under Review, nothing sent {}            Under Review, pending  { documents: 'pending' }
    //   Active                     { documents: 'approved' }
    //   Unsuccessful               { documents: 'rejected', rejectionReason } or a { kind: status } map
    // developerType: 'individual' (default) or 'company'.
    seedDeveloper(options = {}) {
      return this.seedAccount({ ...options, role: 'developer' });
    },
    // An admin review decision (no API exists): status 'approved' | 'rejected' | 'pending' on the latest
    // document of `documentKind`, or of every kind when omitted. Returns the updated documents.
    setDocumentReview: ({ email, documentKind, status, rejectionReason }) =>
      request
        .post(`${BASE}/seed/document-reviews`, { data: { email, documentKind, status, rejectionReason } })
        .then(dataOf),

    // [operation, publicId] pairs the fake storage received (uploads and destroys); nothing reaches Cloudinary.
    storageCalls: () =>
      request
        .get(`${BASE}/storage`)
        .then(dataOf)
        .then((data) => data.calls),
  };
}

export const test = base.extend({
  harness: [
    async ({ request }, use, testInfo) => {
      testInfo.skip(!withApi, 'Needs the e2e API (E2E_WITH_API=false)');
      const harness = createHarness(request);
      await harness.reset();
      await use(harness);
    },
    { auto: true },
  ],
});

export { expect };
