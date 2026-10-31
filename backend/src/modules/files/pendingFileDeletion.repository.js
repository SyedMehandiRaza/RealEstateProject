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

// Public ids still used by a DB row. Every model with a `cloudinaryPublicId` column must be listed here, or the
// orphan job would delete its live files: add a model when another module stores files.
export const FILE_MODELS = [
  'VerificationDocument',
  // Property module (PROP-003).
  'PropertyConfigurationFloorPlan',
  'PropertyMedia',
  'PropertyDocument',
  'PropertyUpdate',
];

export function createReferenceLookup(models) {
  const fileModels = FILE_MODELS.map((name) => models[name]);
  return async function findReferencedPublicIds(publicIds) {
    const referenced = new Set();
    for (let i = 0; i < publicIds.length; i += REFERENCE_CHUNK) {
      const chunk = publicIds.slice(i, i + REFERENCE_CHUNK);
      for (const model of fileModels) {
        const rows = await model.findAll({
          attributes: ['cloudinaryPublicId'],
          where: { cloudinaryPublicId: chunk },
          raw: true,
        });
        for (const row of rows) referenced.add(row.cloudinaryPublicId);
      }
    }
    return referenced;
  };
}
