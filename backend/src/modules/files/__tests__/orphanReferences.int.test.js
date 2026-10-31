import models from '../../../models/index.js';
import { createFakeQueueRepository, createFakeStorage, silentLogger } from '../../../test/fileFakes.js';
import {
  createConfiguration,
  createFloorPlan,
  createProperty,
  createUpdate,
  seedDeveloper,
} from '../../../test/propertyFactories.js';
import { seedDocument } from '../../../test/verificationDocuments.js';
import { createFileDeletionService } from '../fileDeletion.service.js';
import { createOrphanCleanupJob } from '../orphanCleanup.job.js';
import { createReferenceLookup, FILE_MODELS } from '../pendingFileDeletion.repository.js';

// The orphan job with the real reference lookup (PROP-003): files stored by any table that keeps Cloudinary
// files are never queued, so live property files survive; unsubmitted wizard uploads do not.

jest.setTimeout(30_000); // seeding an Account hashes a password

const HOUR = 60 * 60_000;
const now = new Date('2026-10-31T10:00:00Z');
const hoursAgo = (hours) => new Date(now.getTime() - hours * HOUR);
const asset = (publicId, resourceType, createdAt = hoursAgo(48)) => ({
  publicId,
  resourceType,
  deliveryType: 'authenticated',
  createdAt,
});

function runJob(assets) {
  const storage = createFakeStorage({ prefix: 'realestate/test/' });
  storage.assets = assets;
  const repository = createFakeQueueRepository();
  const logger = silentLogger();
  const job = createOrphanCleanupJob({
    storage,
    fileDeletion: createFileDeletionService({ repository, storage, logger }),
    findReferencedPublicIds: createReferenceLookup(models),
    logger,
    now: () => now,
  });
  return job.run().then(() => repository.rows.map((row) => row.publicId));
}

describe('orphan cleanup with the database reference lookup', () => {
  it('keeps every file a property row references: floor plans, media, documents and update images', async () => {
    const owner = await seedDeveloper();
    const property = await createProperty(owner.id, { status: 'under_construction', videos: 1, tours: 1 });
    const configuration = await createConfiguration(property.id);
    const floorPlan = await createFloorPlan(configuration.id, { mimeType: 'application/pdf' });
    const update = await createUpdate(property.id);
    const media = await models.PropertyMedia.findAll({ where: { propertyId: property.id } });
    const documents = await models.PropertyDocument.findAll({ where: { propertyId: property.id } });

    const live = [
      asset(floorPlan.cloudinaryPublicId, 'raw'),
      ...media.map((m) => asset(m.cloudinaryPublicId, m.cloudinaryResourceType)),
      ...documents.map((d) => asset(d.cloudinaryPublicId, d.cloudinaryResourceType)),
      asset(update.cloudinaryPublicId, 'image'),
    ];
    expect(new Set(live.map((a) => a.resourceType))).toEqual(new Set(['image', 'raw', 'video']));

    expect(await runJob(live)).toEqual([]);
  });

  it('queues an unsubmitted wizard upload after the grace period, and keeps a young one', async () => {
    const queued = await runJob([
      asset('realestate/test/properties/7/staging/abandoned', 'image', hoursAgo(25)),
      asset('realestate/test/properties/7/staging/abandoned-video', 'video', hoursAgo(25)),
      asset('realestate/test/properties/7/staging/still-in-wizard', 'image', hoursAgo(2)),
    ]);

    expect(queued).toEqual([
      'realestate/test/properties/7/staging/abandoned',
      'realestate/test/properties/7/staging/abandoned-video',
    ]);
  });

  it('still keeps verification documents', async () => {
    const developer = await seedDeveloper();
    const document = await seedDocument(developer.professionalProfileId, {
      documentKind: 'government_id',
      status: 'pending',
      createdAt: hoursAgo(48),
    });

    expect(await runJob([asset(document.cloudinaryPublicId, 'image')])).toEqual([]);
  });
});

it('checks every model that stores a Cloudinary file', () => {
  const withFiles = Object.values(models)
    .filter((model) => model.rawAttributes?.cloudinaryPublicId)
    .map((model) => model.name);
  expect([...FILE_MODELS].sort()).toEqual(withFiles.sort());
});
