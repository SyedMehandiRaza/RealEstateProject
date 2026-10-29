import models from '../../models/index.js';
import { logger } from '../../utils/logger.js';
import { cloudinaryStorage } from './cloudinary.storage.js';
import { createFileDeletionService } from './fileDeletion.service.js';
import { createFileUploadService } from './fileUpload.service.js';
import { createOrphanCleanupJob } from './orphanCleanup.job.js';
import {
  createPendingFileDeletionRepository,
  createReferenceLookup,
} from './pendingFileDeletion.repository.js';

// Wires the file services to Cloudinary and the database.
export const fileDeletion = createFileDeletionService({
  repository: createPendingFileDeletionRepository(models),
  storage: cloudinaryStorage,
  logger,
});

export const fileUploads = createFileUploadService({ storage: cloudinaryStorage, fileDeletion, logger });

export const orphanCleanup = createOrphanCleanupJob({
  storage: cloudinaryStorage,
  fileDeletion,
  findReferencedPublicIds: createReferenceLookup(models),
  logger,
});

export { startFileJobs } from './fileJobs.js';
