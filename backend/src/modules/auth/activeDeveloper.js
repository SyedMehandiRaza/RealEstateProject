import { AppError } from '../../utils/AppError.js';
import { VERIFICATION_STATUS, verificationStatus } from './verificationStatus.js';

// The "Active developer required" access guard (SPEC-001), for later modules such as properties. Use
// after `authenticate`: no Account → 401; no Developer role in the access token → 403 FORBIDDEN (as
// `authorize('developer')`); a Developer whose Verification status is not Active, including one without
// Professional info → 403 DEVELOPER_NOT_ACTIVE. The status is derived from the database on every
// request (it is not stored, DEC-014), so an approval or a rejection applies at once.
export function createRequireActiveDeveloper({ onboardingRepository }) {
  return async function requireActiveDeveloper(req, _res, next) {
    if (!req.user) throw new AppError('UNAUTHORIZED');
    if (!req.user.roles.includes('developer')) throw new AppError('FORBIDDEN');
    const profile = await onboardingRepository.findProfileWithDocuments(req.user.id);
    const active =
      profile &&
      verificationStatus({ developerType: profile.businessType, documents: profile.documents }).status ===
        VERIFICATION_STATUS.active;
    if (!active) throw new AppError('DEVELOPER_NOT_ACTIVE');
    next();
  };
}
