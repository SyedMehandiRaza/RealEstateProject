// Deletes Cloudinary files through the pending_file_deletions outbox (DEC-018).
// A file is { publicId, resourceType, deliveryType }.

const LAST_ERROR_MAX = 500; // pending_file_deletions.last_error VARCHAR(500)

const errorMessage = (error) => String(error?.message ?? error).slice(0, LAST_ERROR_MAX);

export function createFileDeletionService({
  repository,
  storage,
  logger,
  now = () => new Date(),
  maxAttempts = 5,
  baseDelayMs = 60_000,
}) {
  return {
    // Queue files for deletion. Pass the caller's transaction so the rows commit or roll back with the
    // records being deleted. Never call Cloudinary inside that transaction.
    async enqueue(files, { reason, transaction } = {}) {
      if (files.length === 0) return;
      await repository.insertMany(
        files.map((file) => ({ ...file, reason })),
        { transaction },
      );
    },

    // Compensation for an upload whose DB save failed: delete now; if that fails, queue it for the worker.
    async deleteNowOrEnqueue(file, { reason }) {
      try {
        await storage.destroy(file);
        logger.info({ publicId: file.publicId, reason }, 'Cloudinary file deleted');
      } catch (error) {
        logger.warn({ err: error, publicId: file.publicId }, 'Immediate Cloudinary delete failed; queued');
        await repository.insertMany([{ ...file, reason, lastError: errorMessage(error) }]);
      }
    },

    // Worker step: delete every due file. Failures back off exponentially (1, 2, 4, 8 x baseDelayMs);
    // after maxAttempts the row is marked 'failed' and left for manual review.
    async processDue({ limit = 50 } = {}) {
      const summary = { deleted: 0, retried: 0, failed: 0 };
      const rows = await repository.findDue(now(), limit);

      for (const row of rows) {
        const attempts = row.attempts + 1;
        try {
          await storage.destroy(row);
          await repository.remove(row.id);
          logger.info({ publicId: row.publicId, reason: row.reason, attempts }, 'Cloudinary file deleted');
          summary.deleted += 1;
        } catch (error) {
          const lastError = errorMessage(error);
          if (attempts >= maxAttempts) {
            await repository.markFailed(row.id, { attempts, lastError });
            logger.error(
              { publicId: row.publicId, reason: row.reason, attempts, lastError },
              'Cloudinary delete failed permanently; flagged for review',
            );
            summary.failed += 1;
          } else {
            const nextAttemptAt = new Date(now().getTime() + baseDelayMs * 2 ** (attempts - 1));
            await repository.scheduleRetry(row.id, { attempts, lastError, nextAttemptAt });
            logger.warn(
              { publicId: row.publicId, attempts, nextAttemptAt },
              'Cloudinary delete failed; will retry',
            );
            summary.retried += 1;
          }
        }
      }
      return summary;
    },
  };
}
