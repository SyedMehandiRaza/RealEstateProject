import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Test-only environment, shared by jest.setup.js (every test worker) and globalSetup.js (the parent process).
// Dummy secrets; never real credentials.
export function applyTestEnv() {
  // A parallel-module folder (git worktree) has a root .env.worktree naming its own test database
  // (docs/execution/README.md). Backend commands run from backend/. It never overrides a set variable.
  const worktreeEnv = resolve(process.cwd(), '../.env.worktree');
  if (existsSync(worktreeEnv)) process.loadEnvFile(worktreeEnv);
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  process.env.CORS_ORIGINS ??= 'http://localhost:5173';
  process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-at-least-32-characters-long';
  process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-at-least-32-characters-long';
  process.env.DB_NAME_TEST ??= 'real_estate_test';
  process.env.CLOUDINARY_CLOUD_NAME ??= 'test-cloud';
  process.env.CLOUDINARY_API_KEY ??= 'test-key';
  process.env.CLOUDINARY_API_SECRET ??= 'test-secret';
  // The real SMTP mailer refuses to send when NODE_ENV=test, so these never reach a server.
  process.env.SMTP_SERVICE_HOST ??= 'smtp.invalid';
  process.env.SMTP_SERVICE_PORT ??= '465';
  process.env.SMTP_USER_NAME ??= 'test-mailer@example.com';
  process.env.SMTP_USER_PASSWORD ??= 'test-smtp-password';
  process.env.MAIL_FROM ??= 'Real Estate <no-reply@example.com>';
  process.env.VERIFICATION_CODE_SECRET ??= 'test-verification-code-secret-at-least-32-chars';
  assertTestDatabaseName(process.env.DB_NAME_TEST);
}

// The only database tests may touch is one whose name ends in "_test". Checked before migrating and before
// every cleanup, so a misconfigured DB_NAME_TEST can never wipe the dev or production database.
const TEST_DB_NAME = /^\w+_test$/;

export function assertTestDatabaseName(name) {
  if (typeof name !== 'string' || !TEST_DB_NAME.test(name)) {
    throw new Error(
      `Refusing to run tests against database "${name ?? ''}": its name must end with "_test". ` +
        'Set DB_NAME_TEST to a dedicated test database such as real_estate_test.',
    );
  }
}
