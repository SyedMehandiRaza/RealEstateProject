// Entry point of the e2e start mode (`npm run start:e2e -w backend`, started by e2e/playwright.config.js).
// Order matters: refuse any NODE_ENV but test before anything else loads, then apply the test env (dummy
// secrets, DB_NAME_TEST = real_estate_test unless set) before config/env.js reads it, so real SMTP and
// Cloudinary credentials from backend/.env are never used. Then migrate the test DB and listen.
// No file jobs run here: the orphan cleanup would list the fake storage only, and nothing is due.
import { assertE2eAllowed } from './e2eMode.js';
import { applyTestEnv, assertTestDatabaseName } from './testEnv.js';

try {
  assertE2eAllowed(process.env.NODE_ENV);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
applyTestEnv();

async function start() {
  const { default: databaseConfig } = await import('../config/database.cjs');
  assertTestDatabaseName(databaseConfig.test.database);
  const { runMigrationCli } = await import('./migrations.js');
  runMigrationCli('db:migrate');

  const { env } = await import('../config/env.js');
  const { default: models, sequelize } = await import('../models/index.js');
  const { assertSupportedMysql } = await import('../utils/mysqlVersion.js');
  const { createE2eApp } = await import('./e2eApp.js');

  await sequelize.authenticate();
  const mysqlVersion = await assertSupportedMysql(sequelize);
  const { app } = createE2eApp({ models, sequelize });
  const server = app.listen(env.PORT, () =>
    console.log(
      `E2E API (capture mailer, fake storage) on http://localhost:${env.PORT}, ` +
        `database ${sequelize.getDatabaseName()}, MySQL ${mysqlVersion}`,
    ),
  );

  const shutdown = () => server.close(() => sequelize.close().finally(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('E2E API failed to start:', error.message);
  process.exit(1);
});
