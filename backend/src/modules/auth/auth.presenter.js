import { USER_ROLES } from '@real-estate/shared';

// The `user` object of every auth response (SPEC-001). Built from a User loaded with its `roles`; it
// never contains the password hash or any token.
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
    // Derived from the Developer's documents once Verification status exists (TASK-030).
    developerVerificationStatus: null,
  };
}
