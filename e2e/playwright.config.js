import { defineConfig, devices } from '@playwright/test';

// The suite runs its own frontend and API on ports of their own (5174 and 5100 by default), so a dev
// server on 5173/5000 (real mailer, dev database) is never reused by mistake.
const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:5174';
// 127.0.0.1, not localhost: the e2e API listens on the IPv4 loopback only (TASK-053).
const API_URL = process.env.E2E_API_URL ?? 'http://127.0.0.1:5100';
// Set E2E_WITH_API=false to run UI-only tests without starting the backend (it needs MySQL).
export const withApi = process.env.E2E_WITH_API !== 'false';

const webServer = [
  {
    command: `npm run dev -w frontend -- --port ${new URL(WEB_URL).port} --strictPort`,
    cwd: '..',
    url: WEB_URL,
    // The Vite dev proxy sends /api to the e2e API instead of the dev one.
    env: { ...process.env, API_PROXY_TARGET: API_URL },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
];
if (withApi) {
  // The e2e start mode (DEC-036): NODE_ENV=test, database real_estate_test (migrated at startup), a
  // capture mailer and fake file storage, plus the test-only /api/__e2e routes. Only that server answers
  // the readiness URL, so a different server on the port fails the run instead of being reused.
  webServer.push({
    command: 'npm run start:e2e -w backend',
    cwd: '..',
    url: `${API_URL}/api/__e2e/status`,
    env: { ...process.env, NODE_ENV: 'test', PORT: new URL(API_URL).port, CORS_ORIGINS: WEB_URL },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  });
}

export default defineConfig({
  testDir: './tests',
  // With the API, every test empties the one shared test database first (fixtures/harness.js), so tests
  // run one at a time. Never at the same time as `npm run test:integration` (same database).
  fullyParallel: !withApi,
  workers: withApi ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  expect: {
    // Visual comparisons against the Figma-verified baseline.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer,
});
