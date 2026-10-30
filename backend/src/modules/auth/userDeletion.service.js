import { authMessages } from '@real-estate/shared';
import { AppError } from '../../utils/AppError.js';

// Deletes a user; FK CASCADE removes their roles, tokens, codes, profile and document rows. Their Cloudinary
// files are queued in the same transaction and deleted by the worker after commit (DEC-018).
// An account that owns properties or employs staff is not deleted (PROP-DEC-001): those FKs are RESTRICT,
// so the service answers 409 CONFLICT before MySQL would raise a raw FK error.
export function createUserDeletionService({ sequelize, models, fileDeletion }) {
  return {
    async deleteUser(userId) {
      await sequelize.transaction(async (transaction) => {
        // The row lock also blocks a concurrent property or staff insert for this owner (its FK check
        // needs a shared lock on the users row), so the counts below stay true until the delete.
        const user = await models.User.findByPk(userId, { transaction, lock: true });
        if (!user) throw new AppError('NOT_FOUND');

        const ownedProperties = await models.Property.count({ where: { ownerId: userId }, transaction });
        const employedStaff = await models.StaffMember.count({ where: { employerId: userId }, transaction });
        if (ownedProperties > 0 || employedStaff > 0) {
          throw new AppError('CONFLICT', { message: authMessages.api.accountHasPropertiesOrStaff });
        }

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
