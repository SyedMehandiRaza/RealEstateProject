// MySQL 8.0.16 is the first release that enforces CHECK constraints, which the migrations rely on (Q-004).
// Target version: 8.4 LTS. MySQL 5.7 and MariaDB are not supported.
export const MIN_MYSQL_VERSION = '8.0.16';

export function isSupportedMysqlVersion(version) {
  if (typeof version !== 'string' || /mariadb/i.test(version)) return false;
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) return false;
  const [major, minor, patch] = match.slice(1).map(Number);
  if (major !== 8) return major > 8;
  return minor > 0 || patch >= 16;
}

// Called at startup; the server exits if this throws.
export async function assertSupportedMysql(sequelize) {
  const version = await sequelize.databaseVersion();
  if (!isSupportedMysqlVersion(version)) {
    throw new Error(
      `MySQL ${MIN_MYSQL_VERSION} or newer is required (target: 8.4 LTS), but the server reports "${version}". ` +
        'Upgrade MySQL before starting the API.',
    );
  }
  return version;
}
