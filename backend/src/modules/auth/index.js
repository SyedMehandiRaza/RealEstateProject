import { env } from '../../config/env.js';
import models, { sequelize } from '../../models/index.js';
import { logger } from '../../utils/logger.js';
import { createAuthController } from './auth.controller.js';
import { createAuthRepository } from './auth.repository.js';
import { createAuthRoutes } from './auth.routes.js';
import { createAuthService } from './auth.service.js';
import { createLoginAttemptLimiter } from './loginAttemptLimiter.js';
import { createSessionService } from './session.service.js';
import { createVerificationCodeService } from './verificationCode.service.js';

// Wires the auth module to the database and to createApp's external dependencies (mailer, clock).
export function createAuthRouter({ mailer, clock }) {
  const verificationCodes = createVerificationCodeService({
    models,
    clock,
    secret: env.VERIFICATION_CODE_SECRET,
  });
  const authService = createAuthService({
    sequelize,
    repository: createAuthRepository(models),
    verificationCodes,
    sessions: createSessionService({ models, clock }),
    loginAttempts: createLoginAttemptLimiter({ clock }),
    mailer,
    clock,
    logger,
  });
  return createAuthRoutes(createAuthController(authService));
}
