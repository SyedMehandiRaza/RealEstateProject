// Runs before every *.int.test.js file. Tests get a migrated, empty `real_estate_test` with no extra code.
import { sequelize } from '../models/index.js';
import { resetDatabase } from './testDatabase.js';

beforeAll(() => {
  // Each file empties the shared test database, so two files running at once would delete each other's rows.
  if (process.env.JEST_WORKER_ID !== '1') {
    throw new Error(
      'Integration tests share one database and must run serially: use `npm test` or `--runInBand`.',
    );
  }
});

beforeEach(() => resetDatabase(sequelize));

afterAll(() => sequelize.close());
