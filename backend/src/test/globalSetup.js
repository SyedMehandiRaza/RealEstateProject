import databaseConfig from '../config/database.cjs';
import { applyTestEnv, assertTestDatabaseName } from './testEnv.js';
import { runMigrationCli } from './migrations.js';

// Integration project only, once per run, in Jest's parent process: refuse any database whose name does
// not end in "_test", then bring it to the latest migration.
export default function globalSetup() {
  applyTestEnv();
  assertTestDatabaseName(databaseConfig.test.database);
  runMigrationCli('db:migrate');
}
