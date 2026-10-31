import express, { Router } from 'express';
import { ERROR_CODES } from '@real-estate/shared';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { resetRateLimiters } from '../middlewares/rateLimiter.js';
import { resetLoginAttemptLimiters } from '../modules/auth/loginAttemptLimiter.js';
import { systemClock } from '../utils/clock.js';
import { E2E_BASE_PATH, assertE2eAllowed } from './e2eMode.js';
import { SeedError, seedAccount, setDocumentReview } from './e2eSeeds.js';
import { seedStaff } from './e2eStaffSeeds.js';
import { createFakeMailer } from './fakeMailer.js';
import { createFakeStorage } from './fileFakes.js';
import { resetDatabase } from './testDatabase.js';
import { assertTestDatabaseName } from './testEnv.js';

const sendError = (res, status, code, message = ERROR_CODES[code].message) =>
  res.status(status).json({ success: false, error: { code, message } });

// Test-only routes, mounted at /api/__e2e by createE2eApp and nowhere else. They read what the fakes
// captured, seed rows and empty the test database between tests.
export function createE2eRouter({ models, sequelize, mailer, storage }) {
  const router = Router();
  router.use(express.json({ limit: '100kb' }));

  // The Playwright webServer readiness URL: only an e2e server answers it, so a dev server on the same
  // port is never mistaken for one.
  router.get('/status', (_req, res) =>
    res.json({ success: true, data: { mode: 'e2e', database: sequelize.getDatabaseName() } }),
  );

  // Empties every table (the "_test" guard runs inside), and forgets rate-limit counts, sent mail and
  // stored files, so each test starts from nothing.
  router.post('/reset', async (_req, res) => {
    await resetDatabase(sequelize);
    resetLoginAttemptLimiters();
    await resetRateLimiters();
    mailer.messages.length = 0;
    storage.calls.length = 0;
    storage.assets.length = 0;
    res.status(204).end();
  });

  // The newest code emailed to ?email= (optionally for ?purpose=email_verification|password_reset).
  router.get('/mail/latest', (req, res) => {
    const { email, purpose } = req.query;
    if (typeof email !== 'string' || (purpose !== undefined && typeof purpose !== 'string')) {
      return sendError(res, 400, 'BAD_REQUEST', 'Query ?email= is required, ?purpose= is optional');
    }
    const message = mailer.messages.findLast((m) => m.to === email && (!purpose || m.purpose === purpose));
    if (!message) return sendError(res, 404, 'NOT_FOUND', 'No code was emailed to that address');
    return res.json({ success: true, data: { code: message.code, purpose: message.purpose } });
  });

  // Every upload and destroy the fake storage received, as [operation, publicId] pairs.
  router.get('/storage', (_req, res) => res.json({ success: true, data: { calls: storage.calls } }));

  const seedRoute = (handler) => async (req, res) => {
    try {
      res.status(201).json({ success: true, data: await handler(req.body ?? {}) });
    } catch (error) {
      if (!(error instanceof SeedError)) throw error;
      sendError(res, error.status, error.status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST', error.message);
    }
  };
  router.post(
    '/seed/accounts',
    seedRoute((body) => seedAccount(models, sequelize, body)),
  );
  router.post(
    '/seed/document-reviews',
    seedRoute((body) => setDocumentReview(models, body)),
  );
  // Staff and properties of an employer (STAFF-016).
  router.post(
    '/seed/staff',
    seedRoute((body) => seedStaff(models, body)),
  );

  // Anything unexpected: the message stays in the e2e server's output, never in the response.
  router.use((error, _req, res, _next) => {
    console.error('[e2e harness]', error);
    sendError(res, 500, 'INTERNAL_ERROR');
  });
  return router;
}

// The API as the e2e suite runs it: createApp with a capture mailer (codes are kept, never sent), fake
// file storage (nothing reaches Cloudinary) and the real clock, behind the /api/__e2e routes. Refuses
// anything but NODE_ENV=test and a "_test" database.
export function createE2eApp({ models, sequelize }) {
  assertE2eAllowed(env.NODE_ENV);
  assertTestDatabaseName(sequelize.getDatabaseName());
  const mailer = createFakeMailer();
  const storage = createFakeStorage({ prefix: env.cloudinaryPrefix, uniqueIds: true });

  const app = express();
  app.disable('x-powered-by');
  app.use(E2E_BASE_PATH, createE2eRouter({ models, sequelize, mailer, storage }));
  app.use(createApp({ mailer, storage, clock: systemClock }));
  return { app, mailer, storage };
}
