import { USER_ROLES } from '@real-estate/shared';
import { VERIFICATION_STATUS, verificationStatus } from './verificationStatus.js';

// The `user` object of every auth response (SPEC-001). Built from a User loaded with its `roles` and its
// `professionalProfile` with `documents` (auth.repository); it never contains the password hash or any
// token.
export function toUserResponse(user) {
  const roles = user.roles.map((userRole) => userRole.role);
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    roles: USER_ROLES.filter((role) => roles.includes(role)),
    emailVerified: user.emailVerifiedAt != null,
    preferredCountryCode: user.preferredCountryCode,
    developerVerificationStatus: roles.includes('developer') ? developerStatusOf(user) : null,
  };
}

// The Verification status headline of a Developer (TASK-030). A Developer without Professional info has
// sent nothing yet: Under Review, as verificationStatus answers for no documents (DEC-033).
function developerStatusOf(user) {
  const profile = user.professionalProfile;
  if (profile === undefined) throw new Error('toUserResponse needs the professionalProfile include');
  if (!profile) return VERIFICATION_STATUS.underReview;
  return verificationStatus({ developerType: profile.businessType, documents: profile.documents }).status;
}

// The `profile` of PUT /me/professional-profile, in the request's field names (professionalInfoSchema).
// A Company Name that was not given is null.
export function toProfileResponse(profile) {
  return {
    id: profile.id,
    companyName: profile.organizationName,
    developerType: profile.businessType,
    licenseNumber: profile.licenseNumber,
    experienceLevel: profile.experienceLevel,
    location: profile.location,
  };
}
