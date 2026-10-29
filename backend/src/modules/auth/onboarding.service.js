import { AppError } from '../../utils/AppError.js';
import { toProfileResponse } from './auth.presenter.js';
import { VERIFICATION_STATUS, verificationStatus } from './verificationStatus.js';

// Developer onboarding use cases (SPEC-001): Professional info, and later the Verification documents.
// Input is already validated by the shared schemas; the routes have checked the Developer role.
export function createOnboardingService({ sequelize, repository, onboardingRepository }) {
  const statusOf = (profile) =>
    verificationStatus({ developerType: profile.businessType, documents: profile.documents ?? [] });

  return {
    // Creates or replaces the Developer's one profile (SPEC-001: 200 { profile }). The Account row is
    // locked first, so concurrent PUTs for one Account run in turn and never create two profiles.
    // Editable until the Developer is Active; an Active Developer gets 409 CONFLICT, because editing
    // after approval needs a re-review rule that is not decided (Q-033, assumed option a).
    async saveProfessionalProfile({
      userId,
      companyName,
      developerType,
      licenseNumber,
      experienceLevel,
      location,
    }) {
      const values = {
        organizationName: companyName ?? null,
        businessType: developerType,
        licenseNumber,
        experienceLevel,
        location,
      };
      const profile = await sequelize.transaction(async (transaction) => {
        if (!(await repository.lockUserById(userId, { transaction }))) throw new AppError('UNAUTHORIZED');
        const existing = await onboardingRepository.findProfileWithDocuments(userId, { transaction });
        if (!existing) return onboardingRepository.createProfile({ userId, ...values }, { transaction });
        if (statusOf(existing).status === VERIFICATION_STATUS.active) throw new AppError('CONFLICT');
        return existing.update(values, { transaction });
      });
      return { profile: toProfileResponse(profile) };
    },
  };
}
