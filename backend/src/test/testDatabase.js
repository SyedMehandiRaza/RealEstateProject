import { assertTestDatabaseName } from './testEnv.js';

// Tables that record which migrations and seeders ran; never emptied.
const BOOKKEEPING_TABLES = ['sequelize_meta', 'sequelize_data'];

// Deletes every row of every application table, so each test starts from empty tables. New tables from
// later migrations are picked up automatically. Refuses to run unless the connected database is a "_test" one.
export async function resetDatabase(sequelize) {
  assertTestDatabaseName(sequelize.getDatabaseName());
  const tables = await sequelize.query(
    `SELECT TABLE_NAME AS name FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME NOT IN (:bookkeeping)`,
    { replacements: { bookkeeping: BOOKKEEPING_TABLES }, type: sequelize.QueryTypes.SELECT },
  );

  // One connection for the whole reset, because FOREIGN_KEY_CHECKS is a session variable.
  await sequelize.transaction(async (transaction) => {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
    try {
      for (const { name } of tables) {
        // Table names come from information_schema, not from user input.
        await sequelize.query(`DELETE FROM \`${name}\``, { transaction });
      }
    } finally {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
    }
  });
}
