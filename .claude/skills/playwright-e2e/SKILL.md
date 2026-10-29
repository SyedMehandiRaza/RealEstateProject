---
name: playwright-e2e
description: Write and run Playwright end-to-end tests for module pages, covering user journeys, validation message parity between frontend and backend, and visual comparison against the Figma-matched baseline. Use when adding e2e coverage, verifying a page end to end, or when the user mentions Playwright or e2e.
argument-hint: "<module-name> [page | journey]"
---

# Playwright E2E

Rules: `.claude/rules/testing.md`. The Playwright MCP (plugin `playwright`) is for exploring the running app interactively. The committed tests live in `e2e/` and run with `npx playwright test`.

## Layout
```
e2e/
  playwright.config.js        # baseURL from env, webServer starts backend + frontend, projects: chromium (+ mobile if designed)
  fixtures/                   # auth fixture (storageState), seeded data helpers
  pages/<module>/<Page>.page.js   # page objects: locators via getByRole/getByLabel
  tests/<module>/<page>.spec.js
```

## Steps
1. Explore the flow with the Playwright MCP (navigate, snapshot) to find stable role or label locators. Add a `data-testid` only where no accessible locator exists.
2. Write a page object, then specs for:
   - **Happy path** of the journey (for example create a listing, see it in the list)
   - **Client validation parity**: submit invalid input; expect the on-screen text to equal the shared message constant (import from `shared`)
   - **Server validation parity**: bypass the client (or use a rule only the server can check, such as a duplicate email); expect the same shared message rendered from `error.fields`
   - **Visual**: `await expect(page).toHaveScreenshot('<page>.png', { fullPage: true })` at the Figma frame width, once the page has been verified against Figma with `/figma-to-module`
3. Data: seed through API or test-DB helpers per test; never depend on another test's data; use unique values (timestamps) for unique columns.
4. Run: `npx playwright test e2e/tests/<module>`. On failure, read the trace (`--trace on`) or the HTML report and fix the cause. Do not weaken assertions to make a test pass.
5. Update screenshot baselines (`--update-snapshots`) only after confirming the new UI matches Figma, and say so in the report.

## Done when
- [ ] Journey, client parity, server parity and visual tests exist for the page
- [ ] Tests pass locally (report the actual output)
