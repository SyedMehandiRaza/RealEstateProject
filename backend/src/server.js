import { createApp } from './app.js';
import { env } from './config/env.js';
import { sequelize } from './models/index.js';
import { fileDeletion, orphanCleanup, startFileJobs } from './modules/files/index.js';
import { logger } from './utils/logger.js';
import { assertSupportedMysql } from './utils/mysqlVersion.js';

async function start() {
  await sequelize.authenticate();
  const mysqlVersion = await assertSupportedMysql(sequelize);
  logger.info(`Database connection established (MySQL ${mysqlVersion})`);

  const server = createApp().listen(env.PORT, () =>
    logger.info(`API listening on http://localhost:${env.PORT}`),
  );
  const stopFileJobs = startFileJobs({ fileDeletion, orphanCleanup, logger });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    stopFileJobs();
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});
