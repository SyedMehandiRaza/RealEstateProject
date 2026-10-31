import { createFileDeletionService } from '../fileDeletion.service.js';
import { createOrphanCleanupJob } from '../orphanCleanup.job.js';
import { createFakeQueueRepository, createFakeStorage, silentLogger } from '../../../test/fileFakes.js';

const HOUR = 60 * 60_000;
const now = new Date('2026-10-29T10:00:00Z');
const hoursAgo = (hours) => new Date(now.getTime() - hours * HOUR);

function asset(publicId, createdAt, resourceType = 'image') {
  return { publicId, resourceType, deliveryType: 'authenticated', createdAt };
}

function setup({ assets, referenced = [] }) {
  const storage = createFakeStorage({ prefix: 'realestate/test/' });
  storage.assets = assets;
  const repository = createFakeQueueRepository();
  const logger = silentLogger();
  const fileDeletion = createFileDeletionService({ repository, storage, logger });
  const findReferencedPublicIds = jest.fn(
    async (publicIds) => new Set(publicIds.filter((id) => referenced.includes(id))),
  );
  const job = createOrphanCleanupJob({
    storage,
    fileDeletion,
    findReferencedPublicIds,
    logger,
    now: () => now,
  });
  return { job, repository, storage, logger, findReferencedPublicIds };
}

describe('orphan cleanup job', () => {
  it('enqueues unreferenced files older than 24 hours, for both images and raw files', async () => {
    const { job, repository, logger } = setup({
      assets: [
        asset('realestate/test/documents/1/old-image', hoursAgo(25)),
        asset('realestate/test/documents/1/old.pdf', hoursAgo(48), 'raw'),
      ],
    });

    const summary = await job.run();

    expect(summary).toEqual({ scanned: 2, queued: 2 });
    expect(repository.rows).toEqual([
      expect.objectContaining({ publicId: 'realestate/test/documents/1/old-image', reason: 'orphan' }),
      expect.objectContaining({ publicId: 'realestate/test/documents/1/old.pdf', resourceType: 'raw' }),
    ]);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ publicId: 'realestate/test/documents/1/old-image' }),
      'Orphan Cloudinary file queued for deletion',
    );
  });

  it('enqueues unreferenced videos too (property gallery videos and 360 tours, PROP-DEC-013)', async () => {
    const { job, repository } = setup({
      assets: [asset('realestate/test/properties/1/staging/old-video', hoursAgo(25), 'video')],
    });

    expect(await job.run()).toEqual({ scanned: 1, queued: 1 });
    expect(repository.rows).toEqual([
      expect.objectContaining({
        publicId: 'realestate/test/properties/1/staging/old-video',
        resourceType: 'video',
      }),
    ]);
  });

  it('ignores files younger than 24 hours (an upload may still be saving)', async () => {
    const { job, repository } = setup({
      assets: [
        asset('realestate/test/documents/1/fresh', hoursAgo(23.9)),
        asset('realestate/test/documents/1/exactly-24h', hoursAgo(24)),
      ],
    });

    await job.run();

    expect(repository.rows).toHaveLength(0);
  });

  it('ignores files outside the app prefix, even if Cloudinary returns them', async () => {
    const { job, repository, findReferencedPublicIds } = setup({
      assets: [
        asset('realestate/production/documents/1/a', hoursAgo(72)),
        asset('other-app/documents/1/a', hoursAgo(72)),
        asset('realestate/testing/documents/1/a', hoursAgo(72)),
      ],
    });

    await job.run();

    expect(repository.rows).toHaveLength(0);
    for (const [publicIds] of findReferencedPublicIds.mock.calls) {
      expect(publicIds).toEqual([]);
    }
  });

  it('keeps files that are still referenced in the database', async () => {
    const { job, repository } = setup({
      assets: [
        asset('realestate/test/documents/1/in-use', hoursAgo(100)),
        asset('realestate/test/documents/1/orphan', hoursAgo(100)),
      ],
      referenced: ['realestate/test/documents/1/in-use'],
    });

    await job.run();

    expect(repository.rows.map((row) => row.publicId)).toEqual(['realestate/test/documents/1/orphan']);
  });

  it('never deletes from Cloudinary directly; the worker does that', async () => {
    const { job, storage } = setup({ assets: [asset('realestate/test/documents/1/x', hoursAgo(30))] });

    await job.run();

    expect(storage.calls).toEqual([]);
  });
});
