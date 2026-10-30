import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { ERROR_CODES } from '@real-estate/shared';
import { createApp } from '../../app.js';
import models, { sequelize } from '../../models/index.js';
import { createE2eApp } from '../e2eApp.js';
import { E2E_BASE_PATH, assertE2eAllowed } from '../e2eMode.js';

// The e2e start mode (TASK-042, DEC-036): its routes exist only in the e2e app, and it refuses to start
// outside NODE_ENV=test or against a database whose name does not end in "_test". No database needed.

const E2E_ROUTES = [
  ['get', '/status'],
  ['post', '/reset'],
  ['get', '/mail/latest?email=a@example.com'],
  ['get', '/storage'],
  ['post', '/seed/accounts'],
  ['post', '/seed/document-reviews'],
];

describe('e2e start mode', () => {
  describe('the regular app (development and production)', () => {
    it.each(E2E_ROUTES)('has no %s %s route', async (method, route) => {
      const res = await request(createApp())[method](`${E2E_BASE_PATH}${route}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it.each(['server.js', 'app.js', 'routes/index.js'])('src/%s never imports the test harness', (file) => {
      const source = readFileSync(path.join(process.cwd(), 'src', file), 'utf8');
      expect(source).not.toMatch(/from '\.{1,2}\/(\.\.\/)*test\//);
    });
  });

  describe('refusal', () => {
    it.each(['production', 'development'])('refuses NODE_ENV=%s', (nodeEnv) => {
      expect(() => assertE2eAllowed(nodeEnv)).toThrow(/Refusing to start the e2e server/);
    });

    it.each(['test', undefined])('allows NODE_ENV=%s', (nodeEnv) => {
      expect(() => assertE2eAllowed(nodeEnv)).not.toThrow();
    });

    it('refuses a database whose name does not end in "_test"', () => {
      const devDatabase = { getDatabaseName: () => 'real_estate' };
      expect(() => createE2eApp({ models, sequelize: devDatabase })).toThrow(/must end with "_test"/);
    });

    it('the e2e server exits at startup under NODE_ENV=production, before loading the app', () => {
      const result = spawnSync(process.execPath, ['src/test/e2eServer.js'], {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'production', PORT: '0' },
        encoding: 'utf8',
        timeout: 20_000,
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/Refusing to start the e2e server with NODE_ENV=production/);
      expect(result.stdout).not.toMatch(/E2E API/);
    });
  });

  describe('the e2e app', () => {
    let app;
    let mailer;
    beforeEach(() => {
      ({ app, mailer } = createE2eApp({ models, sequelize }));
    });

    it('answers the readiness route with the test database name', async () => {
      const res = await request(app).get(`${E2E_BASE_PATH}/status`);
      expect(res.status).toBe(200);
      // DB_NAME_TEST differs per module folder (docs/execution/README.md); testEnv.js defaults it to real_estate_test.
      expect(res.body.data).toEqual({ mode: 'e2e', database: process.env.DB_NAME_TEST });
    });

    it('still serves the API behind the harness routes', async () => {
      expect((await request(app).get('/api/health')).status).toBe(200);
      expect((await request(app).get('/api/nope')).body.error.message).toBe(ERROR_CODES.NOT_FOUND.message);
    });

    it('captures emailed codes instead of sending them, newest first, per purpose', async () => {
      const email = 'sara@example.com';
      await mailer.sendVerificationCode({ to: email, code: '111111', purpose: 'email_verification' });
      await mailer.sendVerificationCode({ to: email, code: '222222', purpose: 'password_reset' });
      await mailer.sendVerificationCode({
        to: 'other@example.com',
        code: '333333',
        purpose: 'password_reset',
      });

      const latest = (query) => request(app).get(`${E2E_BASE_PATH}/mail/latest`).query(query);
      expect((await latest({ email })).body.data).toEqual({ code: '222222', purpose: 'password_reset' });
      expect((await latest({ email, purpose: 'email_verification' })).body.data.code).toBe('111111');
      expect((await latest({ email: 'nobody@example.com' })).status).toBe(404);
      expect((await latest({})).status).toBe(400);
    });

    it('refuses a seed request it cannot honour with 400 and the reason', async () => {
      const res = await request(app).post(`${E2E_BASE_PATH}/seed/accounts`).send({ role: 'admin' });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/role must be one of buyer, developer/);
    });
  });
});
