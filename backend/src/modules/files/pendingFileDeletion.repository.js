import { Op } from 'sequelize';

const REFERENCE_CHUNK = 500;

// Sequelize access to pending_file_deletions, in the shape fileDeletion.service.js expects.
export function createPendingFileDeletionRepository({ PendingFileDeletion }) {
  return {
    // A file already queued is left as it is (unique key on the asset), so enqueueing twice is harmless.
    insertMany(entries, { transaction } = {}) {
      return PendingFileDeletion.bulkCreate(
        entries.map(({ publicId, resourceType, deliveryType, reason, lastError = null }) => ({
          publicId,
          resourceType,
          deliveryType,
          reason,
          lastError,
        })),
        { transaction, updateOnDuplicate: ['updatedAt'] },
      );
    },

    async findDue(now, limit) {
      const rows = await PendingFileDeletion.findAll({
        where: { status: 'pending', nextAttemptAt: { [Op.lte]: now } },
        order: [['nextAttemptAt', 'ASC']],
        limit,
      });
      return rows.map((row) => row.get({ plain: true }));
    },

    remove(id) {
      return PendingFileDeletion.destroy({ where: { id } });
    },

    scheduleRetry(id, { attempts, lastError, nextAttemptAt }) {
      return PendingFileDeletion.update({ attempts, lastError, nextAttemptAt }, { where: { id } });
    },

    markFailed(id, { attempts, lastError }) {
      return PendingFileDeletion.update({ attempts, lastError, status: 'failed' }, { where: { id } });
    },
  };
}

// Public ids still used by a DB row. Add a lookup here when another module (e.g. properties) stores files.
export function createReferenceLookup({ VerificationDocument }) {
  return async function findReferencedPublicIds(publicIds) {
    const referenced = new Set();
    for (let i = 0; i < publicIds.length; i += REFERENCE_CHUNK) {
      const rows = await VerificationDocument.findAll({
        attributes: ['cloudinaryPublicId'],
        where: { cloudinaryPublicId: publicIds.slice(i, i + REFERENCE_CHUNK) },
        raw: true,
      });
      for (const row of rows) referenced.add(row.cloudinaryPublicId);
    }
    return referenced;
  };
}
