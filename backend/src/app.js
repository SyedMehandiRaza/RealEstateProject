import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger, serializeError } from './utils/logger.js';
import { systemClock } from './utils/clock.js';
import { cloudinaryStorage } from './modules/files/cloudinary.storage.js';
import { smtpMailer } from './modules/mail/smtp.mailer.js';
import { createApiRouter } from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

// The external dependencies createApp accepts, and the methods each must implement.
const DEPENDENCY_METHODS = {
  mailer: ['sendVerificationCode'],
  storage: ['newPublicId', 'upload', 'destroy', 'list', 'deliveryUrl'],
  clock: ['now'],
};

function assertDependencies(overrides) {
  for (const [name, value] of Object.entries(overrides)) {
    const methods = DEPENDENCY_METHODS[name];
    if (!methods) {
      throw new TypeError(
        `Unknown createApp dependency "${name}". Expected one of: ${Object.keys(DEPENDENCY_METHODS).join(', ')}`,
      );
    }
    const missing = methods.filter((method) => typeof value?.[method] !== 'function');
    if (missing.length > 0) {
      throw new TypeError(`${name} must implement ${missing.map((method) => `${method}()`).join(', ')}`);
    }
  }
}

// Builds the Express app without listening, so tests can use it with supertest.
// External dependencies default to the real ones; tests inject fakes (see src/test/testApp.js).
export function createApp(overrides = {}) {
  assertDependencies(overrides);
  const dependencies = Object.freeze({
    mailer: smtpMailer,
    storage: cloudinaryStorage,
    clock: systemClock,
    ...overrides,
  });

  const app = express();
  app.locals.dependencies = dependencies;

  app.disable('x-powered-by');
  // Off unless TRUST_PROXY names a hop count, so X-Forwarded-For cannot pick a client's per-IP budget.
  app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  // pino-http would replace the logger's err serializer with pino's standard one (TASK-053).
  if (!env.isTest) app.use(pinoHttp({ logger, serializers: { err: serializeError } }));

  app.use('/api', createApiRouter(dependencies));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
