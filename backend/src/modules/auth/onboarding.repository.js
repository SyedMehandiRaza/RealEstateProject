// Sequelize queries for Developer onboarding: the professional profile (one per Account,
// uq_professional_profiles_user_id) and its verification documents.
export function createOnboardingRepository(models) {
  const { ProfessionalProfile, VerificationDocument } = models;

  return {
    // The Account's profile with all its document rows (history included), or null.
    findProfileWithDocuments(userId, { transaction } = {}) {
      return ProfessionalProfile.findOne({
        where: { userId },
        include: [{ model: VerificationDocument, as: 'documents' }],
        transaction,
      });
    },

    // The profile row only, locked FOR UPDATE, so concurrent submissions for one profile run in turn.
    lockProfile(profileId, { transaction }) {
      return ProfessionalProfile.findByPk(profileId, { transaction, lock: transaction.LOCK.UPDATE });
    },

    findDocuments(profileId, { transaction } = {}) {
      return VerificationDocument.findAll({ where: { professionalProfileId: profileId }, transaction });
    },

    createProfile(values, { transaction }) {
      return ProfessionalProfile.create(values, { transaction });
    },

    createDocuments(rows, { transaction }) {
      return VerificationDocument.bulkCreate(rows, { transaction });
    },
  };
}
