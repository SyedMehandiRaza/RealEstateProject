// Two projects:
// - unit: every *.test.js except *.int.test.js. In-memory fakes only, never the database; runs in parallel.
// - integration: *.int.test.js. Real MySQL `real_estate_test`, migrated once by globalSetup and emptied
//   before every test by src/test/integrationSetup.js. Must run serially (`--runInBand`); `npm test` does.
const shared = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/jest.setup.js'],
};

export default {
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/migrations/**',
    '!src/seeders/**',
    '!src/test/**',
  ],
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testPathIgnorePatterns: ['/node_modules/', '\\.int\\.test\\.js$'],
      setupFilesAfterEnv: ['<rootDir>/src/test/setupAfterEnv.js'],
    },
    {
      ...shared,
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.int.test.js'],
      globalSetup: '<rootDir>/src/test/globalSetup.js',
      setupFilesAfterEnv: ['<rootDir>/src/test/setupAfterEnv.js', '<rootDir>/src/test/integrationSetup.js'],
    },
  ],
};
