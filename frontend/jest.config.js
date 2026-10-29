export default {
  // jsdom with Node's fetch/Request/streams, required by MSW and RTK Query.
  testEnvironment: 'jest-fixed-jsdom',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Several dependencies (MSW's tree) ship ESM only, some as .mjs. Compile node_modules too;
  // Jest caches the result, so only the first run is slower.
  transform: { '\\.[mc]?jsx?$': 'babel-jest' },
  transformIgnorePatterns: [],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(png|jpe?g|gif|webp|avif|svg|ico|woff2?)$': '<rootDir>/src/test/fileStub.cjs',
  },
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx', '!src/test/**'],
};
