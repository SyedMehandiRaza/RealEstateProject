# E2E (Playwright)

```
e2e/
  playwright.config.js     # starts the frontend (5174) and, unless E2E_WITH_API=false, the e2e API (5100)
  fixtures/harness.js      # `test`/`expect` for API specs: data reset per test, captured codes, seed helpers
  fixtures/visual.js       # expectPageScreenshot(page, name, { mask }): waits for fonts and images, full page
  pages/<module>/          # page objects (getByRole / getByLabel locators)
  tests/<module>/          # specs: journeys, validation-message parity, visual (toHaveScreenshot)
  tests/<module>/<spec>.js-snapshots/  # committed baselines, named <name>-chromium-win32.png
```

- First time: `npm run install:browsers -w e2e`
- Run all: `npm run test:e2e` (needs MySQL; the API reads the DB login from `backend/.env`)
- UI-only: `E2E_WITH_API=false npm run test:e2e` (PowerShell: `$env:E2E_WITH_API='false'; npm run test:e2e`)
- Report: `npm run report -w e2e`

## The e2e API (DEC-036)

`npm run start:e2e -w backend` is the API in its e2e start mode: `NODE_ENV=test` only (it refuses anything else), database `real_estate_test` (migrated at startup, `_test` guard), a capture mailer (codes are kept, never emailed), fake file storage (nothing reaches Cloudinary), dummy secrets, and test-only routes under `/api/__e2e` that exist in no other mode. Playwright starts it and waits for `/api/__e2e/status`, so a dev server is never reused.

- **Do not run e2e and `npm run test:integration` at the same time**: both empty `real_estate_test`.
- With the API, tests run one at a time; every test that imports `test` from `fixtures/harness.js` starts from empty tables (and fresh rate limits, mail and storage). Such tests are skipped in UI-only mode; UI-only specs import from `@playwright/test`.
- The `harness` fixture: `latestCode(email, purpose)`, `seedBuyer(options)`, `seedDeveloper(options)` (`{ professionalInfo: false }`, `{}`, `{ documents: 'pending' | 'approved' | 'rejected' }` or a `{ kind: status }` map, `developerType`), `setDocumentReview({ email, documentKind?, status, rejectionReason? })`, `storageCalls()`, `status()`, `reset()`. Options are documented in `backend/src/test/e2eSeeds.js`. Seeded Accounts use the password `secret123` unless given one.
- Ports: `E2E_WEB_URL` (default `http://localhost:5174`) and `E2E_API_URL` (default `http://localhost:5100`).

## Auth specs (TASK-043..045)

- `tests/auth/buyer-journey.spec.js`: Sign up, Verify, Select a country, Log in; two pages refreshing at once (TASK-046).
- `tests/auth/password-reset.spec.js`: Forgot Password, reset Verify, Reset password, then Log in with the new password.
- `fixtures/parity.js`: `formCases` (the shared cases a form can type), `forbidRequests` (assert no request was sent), `sendPastClient` (rewrite a request body with `page.route` so the API judges it).
- Parity: client rules replay the shared cases (`@real-estate/shared/testing`) a form can express and assert that no request was sent; server rules (a duplicate email, a wrong code, an early resend, a refused value sent past the client with `page.route`) assert the message from `error.fields`. Messages are always imported from `@real-estate/shared`.
- Visual: one baseline per auth page at 1440 wide (`maxDiffPixelRatio` 0.005). Baselines are per platform (`-win32`); another OS needs its own (`npx playwright test --update-snapshots` after checking the page against Figma). Fonts load from Google Fonts, so the visual tests need the network.
