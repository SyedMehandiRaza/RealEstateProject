import { AppError } from '../../utils/AppError.js';

// Deletes a user; FK CASCADE removes their roles, tokens, codes, profile and document rows. Their Cloudinary
// files are queued in the same transaction and deleted by the worker after commit (DEC-018).
export function createUserDeletionService({ sequelize, models, fileDeletion }) {
  return {
    async deleteUser(userId) {
      await sequelize.transaction(async (transaction) => {
        const user = await models.User.findByPk(userId, { transaction, lock: true });
        if (!user) throw new AppError('NOT_FOUND');

        const documents = await models.VerificationDocument.findAll({
          attributes: ['cloudinaryPublicId', 'cloudinaryResourceType'],
          include: [
            {
              model: models.ProfessionalProfile,
              as: 'professionalProfile',
              attributes: [],
              where: { userId },
              required: true,
            },
          ],
          transaction,
        });

        await fileDeletion.enqueue(
          documents.map((document) => ({
            publicId: document.cloudinaryPublicId,
            resourceType: document.cloudinaryResourceType,
            deliveryType: 'authenticated',
          })),
          { reason: 'record_deleted', transaction },
        );

        await user.destroy({ transaction });
      });
    },
  };
}
