import { env } from '../../config/env.js';
import models, { sequelize } from '../../models/index.js';
import { logger } from '../../utils/logger.js';
import { createFileDeletionService } from '../files/fileDeletion.service.js';
import { createFileUploadService } from '../files/fileUpload.service.js';
import { createPendingFileDeletionRepository } from '../files/pendingFileDeletion.repository.js';
import { createAuthController } from './auth.controller.js';
import { createAuthRepository } from './auth.repository.js';
import { createAuthRoutes } from './auth.routes.js';
import { createAuthService } from './auth.service.js';
import { createLoginAttemptLimiter } from './loginAttemptLimiter.js';
import { createOnboardingRepository } from './onboarding.repository.js';
import { createOnboardingService } from './onboarding.service.js';
import { createResetTokens } from './resetToken.js';
import { createSessionService } from './session.service.js';
import { createVerificationCodeService } from './verificationCode.service.js';

// Wires the auth module to the database and to createApp's external dependencies (mailer, storage, clock).
export function createAuthRouter({ mailer, storage, clock }) {
  const verificationCodes = createVerificationCodeService({
    models,
    clock,
    secret: env.VERIFICATION_CODE_SECRET,
  });
  const repository = createAuthRepository(models);
  const authService = createAuthService({
    sequelize,
    repository,
    verificationCodes,
    sessions: createSessionService({ models, clock }),
    loginAttempts: createLoginAttemptLimiter({ clock }),
    // Keys derived from the access secret, never equal to it (DEC-029).
    resetTokens: createResetTokens({ parentSecret: env.JWT_ACCESS_SECRET, clock }),
    mailer,
    clock,
    logger,
  });
  const onboardingService = createOnboardingService({
    sequelize,
    repository,
    onboardingRepository: createOnboardingRepository(models),
    // Built on the injected storage (a fake in tests), not the files module's Cloudinary singletons.
    fileUploads: createFileUploadService({
      storage,
      fileDeletion: createFileDeletionService({
        repository: createPendingFileDeletionRepository(models),
        storage,
        logger,
      }),
      logger,
    }),
    clock,
  });
  return createAuthRoutes(createAuthController(authService, onboardingService));
}
