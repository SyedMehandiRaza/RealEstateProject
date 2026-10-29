# E2E (Playwright)

```
e2e/
  playwright.config.js     # starts frontend (and backend unless E2E_WITH_API=false)
  fixtures/                # auth fixtures (storageState), seed helpers
  pages/<module>/          # page objects (getByRole / getByLabel locators)
  tests/<module>/          # specs: journeys, validation-message parity, visual (toHaveScreenshot)
```

- First time: `npm run install:browsers -w e2e`
- Run all: `npm run test:e2e` (backend needs MySQL and `backend/.env`)
- UI-only: `E2E_WITH_API=false npm run test:e2e` (PowerShell: `$env:E2E_WITH_API='false'; npm run test:e2e`)
- Report: `npm run report -w e2e`
