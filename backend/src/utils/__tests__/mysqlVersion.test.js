import { assertSupportedMysql, isSupportedMysqlVersion } from '../mysqlVersion.js';

describe('isSupportedMysqlVersion', () => {
  it.each(['8.0.16', '8.0.39', '8.4.3', '8.4.0-commercial', '9.1.0'])('accepts %s', (version) => {
    expect(isSupportedMysqlVersion(version)).toBe(true);
  });

  it.each(['8.0.15', '8.0.0', '5.7.44', '5.7.44-log', '10.11.6-MariaDB', 'not a version', undefined])(
    'rejects %s',
    (version) => {
      expect(isSupportedMysqlVersion(version)).toBe(false);
    },
  );
});

describe('assertSupportedMysql', () => {
  const fakeSequelize = (version) => ({ databaseVersion: async () => version });

  it('returns the version when it is supported', async () => {
    await expect(assertSupportedMysql(fakeSequelize('8.4.3'))).resolves.toBe('8.4.3');
  });

  it('throws a clear error naming the required and actual versions', async () => {
    await expect(assertSupportedMysql(fakeSequelize('5.7.44'))).rejects.toThrow(
      'MySQL 8.0.16 or newer is required (target: 8.4 LTS), but the server reports "5.7.44"',
    );
  });
});
