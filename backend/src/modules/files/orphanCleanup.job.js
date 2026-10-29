// Daily job: queue Cloudinary files under the app prefix that no DB row references (DEC-018).
// It only enqueues; the deletion worker does the deleting (and logs each one).

const DAY_MS = 24 * 60 * 60_000;

// Every kind of asset the app uploads. Add a kind here when a module uploads a new one.
const ASSET_KINDS = [
  { resourceType: 'image', deliveryType: 'authenticated' },
  { resourceType: 'raw', deliveryType: 'authenticated' },
];

export function createOrphanCleanupJob({
  storage,
  fileDeletion,
  findReferencedPublicIds,
  logger,
  now = () => new Date(),
  minAgeMs = DAY_MS,
}) {
  return {
    async run() {
      // Only files strictly older than the cutoff: a younger file may belong to an upload still saving.
      const cutoff = now().getTime() - minAgeMs;
      const summary = { scanned: 0, queued: 0 };

      for (const kind of ASSET_KINDS) {
        const candidates = [];
        for await (const asset of storage.list(kind)) {
          summary.scanned += 1;
          // Cloudinary filters by prefix already; check again so this job can never touch other files.
          if (!asset.publicId.startsWith(storage.prefix)) continue;
          if (asset.createdAt.getTime() >= cutoff) continue;
          candidates.push(asset);
        }

        const referenced = await findReferencedPublicIds(candidates.map((asset) => asset.publicId));
        const orphans = candidates
          .filter((asset) => !referenced.has(asset.publicId))
          .map(({ publicId, resourceType, deliveryType }) => ({ publicId, resourceType, deliveryType }));

        for (const orphan of orphans) {
          logger.info({ publicId: orphan.publicId }, 'Orphan Cloudinary file queued for deletion');
        }
        await fileDeletion.enqueue(orphans, { reason: 'orphan' });
        summary.queued += orphans.length;
      }
      return summary;
    },
  };
}
