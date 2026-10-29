// Test-only environment. Dummy secrets; never real credentials.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.CORS_ORIGINS ??= 'http://localhost:5173';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-at-least-32-characters-long';
process.env.DB_NAME_TEST ??= 'real_estate_test';
process.env.CLOUDINARY_CLOUD_NAME ??= 'test-cloud';
process.env.CLOUDINARY_API_KEY ??= 'test-key';
process.env.CLOUDINARY_API_SECRET ??= 'test-secret';

if (!process.env.DB_NAME_TEST.endsWith('_test')) {
  throw new Error('DB_NAME_TEST must end with "_test"; refusing to run tests against another database.');
}
