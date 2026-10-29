import fs from 'node:fs';
import path from 'node:path';
import { sequelize } from '../index.js';
import { runMigrationCli } from '../../test/migrations.js';

const APP_TABLES = [
  'pending_file_deletions',
  'professional_profiles',
  'refresh_tokens',
  'user_roles',
  'users',
  'verification_codes',
  'verification_documents',
];

const migrationsDir = path.join(process.cwd(), 'src', 'migrations');
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.cjs'))
  .sort();

const tableNames = async () =>
  (
    await sequelize.query(
      `SELECT TABLE_NAME AS name FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
      { type: sequelize.QueryTypes.SELECT },
    )
  ).map((row) => row.name);

const appliedMigrations = async () =>
  (
    await sequelize.query('SELECT name FROM sequelize_meta ORDER BY name', {
      type: sequelize.QueryTypes.SELECT,
    })
  ).map((row) => row.name);

// The round trip drops every table of the test database, so it only runs when asked for explicitly:
//   $env:TEST_MIGRATION_ROUNDTRIP='true'; npm run test:integration -w backend
const itRoundTrip = process.env.TEST_MIGRATION_ROUNDTRIP === 'true' ? it : it.skip;

describe('migrations', () => {
  it('are all applied to the test database before the run', async () => {
    expect(await appliedMigrations()).toEqual(migrationFiles);
    expect(await tableNames()).toEqual(expect.arrayContaining(APP_TABLES));
  });

  it.each(migrationFiles)('%s has an up and a down', async (file) => {
    const migration = await import(path.join(migrationsDir, file));
    expect(typeof migration.up).toBe('function');
    expect(typeof migration.down).toBe('function');
  });

  // Leaves the database fully migrated, as every other integration test expects.
  itRoundTrip(
    'all go up, down to zero and up again',
    async () => {
      runMigrationCli('db:migrate:undo:all');
      expect(await appliedMigrations()).toEqual([]);
      expect((await tableNames()).filter((name) => APP_TABLES.includes(name))).toEqual([]);

      runMigrationCli('db:migrate');
      expect(await appliedMigrations()).toEqual(migrationFiles);
      expect(await tableNames()).toEqual(expect.arrayContaining(APP_TABLES));
    },
    60_000,
  );
});
