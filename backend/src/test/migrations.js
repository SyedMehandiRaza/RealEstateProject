import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

// Runs sequelize-cli against the test database, exactly as `npm run db:migrate -w backend` would.
// Jest's working directory is the backend workspace (.sequelizerc resolves paths from it).
export function runMigrationCli(...args) {
  const cwd = process.cwd();
  const cli = createRequire(path.join(cwd, 'package.json')).resolve('sequelize-cli/lib/sequelize');
  const result = spawnSync(process.execPath, [cli, ...args, '--env', 'test'], {
    cwd,
    env: { ...process.env, NODE_ENV: 'test' },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      `sequelize-cli ${args.join(' ')} failed:\n${result.stderr || result.stdout || result.error}`,
    );
  }
  return result.stdout;
}
