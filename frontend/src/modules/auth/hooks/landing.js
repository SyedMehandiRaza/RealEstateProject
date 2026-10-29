import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { authApi } from '../api/authApi.js';
import { AUTH_PATHS } from '../routes.jsx';

const HOME_PATH = '/';

// The landing rule (Q-034, DEC-039, TASK-041): an Account resumes onboarding at its first unfinished step.
// - Developer (also an Account with both roles), until Active: Professional info, then Upload Document,
//   then the status screen. GET /me/verification tells the steps apart: 403 = no Professional info yet,
//   an entry with `status: null` = a document still missing, otherwise the status screen.
// - Buyer: Select a country while no `preferredCountryCode` is saved, then home.
// - Everyone else, and a Developer once Active: home. A dual-role Account that is Active continues with
//   the Buyer rule (assumption: "developer flow until Active" hands over to the Buyer rule afterwards).
// Used after Log in, Verify email and Select a country (useLandingPath), and by OnboardingGuard when an
// onboarding page is opened out of order, including after a reload (session restore, TASK-049).

// The 403 of GET /me/verification: the Developer has no Professional info yet.
export const NO_PROFILE = 'no-profile';

// A function, not a constant: routes.jsx imports this module, so AUTH_PATHS is read only at run time.
const developerSteps = () => [
  AUTH_PATHS.professionalInfo,
  AUTH_PATHS.uploadDocuments,
  AUTH_PATHS.verificationStatus,
];

const hasRole = (user, role) => Boolean(user?.roles?.includes(role));

// True while the developer flow is not finished, so the next step depends on GET /me/verification.
// `verification` (optional) is fresher than `user.developerVerificationStatus` when it is known.
export const developerFlowOpen = (user, verification) =>
  hasRole(user, 'developer') &&
  user.developerVerificationStatus !== 'active' &&
  verification?.status !== 'active';

// GET /me/verification result -> the `verification` argument below: its data, NO_PROFILE for a 403, or
// undefined when it is not known (not loaded, or another error).
export const verificationFrom = ({ data, error }) => (error?.status === 403 ? NO_PROFILE : data);

// The path of the Account's first unfinished step. `verification` is the GET /me/verification data,
// NO_PROFILE, or undefined. Returns null when the developer flow is open and `verification` is unknown.
export function landingPath(user, verification) {
  if (developerFlowOpen(user, verification)) {
    if (verification === NO_PROFILE) return AUTH_PATHS.professionalInfo;
    if (!verification) return null;
    const documents = verification.documents ?? [];
    if (documents.length === 0 || documents.some((document) => document.status == null)) {
      return AUTH_PATHS.uploadDocuments;
    }
    return AUTH_PATHS.verificationStatus;
  }
  if (hasRole(user, 'buyer') && !user.preferredCountryCode) return AUTH_PATHS.selectCountry;
  return HOME_PATH;
}

// Where an onboarding page (`page`, an AUTH_PATHS value) sends the Account instead of rendering, or
// null to render it. Only a step after the first unfinished one is out of order: earlier steps stay
// open (Professional info is editable until Active, Q-033; a Buyer may change the country anytime), and
// the status screen still shows Approved once Active. Select a country waits for an open developer flow.
export function outOfOrderRedirect(page, user, verification) {
  if (!developerFlowOpen(user, verification)) return null;
  const next = landingPath(user, verification);
  if (next === null) return null;
  if (page === AUTH_PATHS.selectCountry) return next;
  const steps = developerSteps();
  return steps.indexOf(page) > steps.indexOf(next) ? next : null;
}

// Resolves where `user` lands right now: loads GET /me/verification when the developer flow is open
// (fresh, not kept subscribed; the next page reuses the cached answer). If that request fails for
// another reason, the status screen opens and shows the error.
export function useLandingPath() {
  const dispatch = useDispatch();
  return useCallback(
    async (user) => {
      if (!developerFlowOpen(user)) return landingPath(user);
      const result = await dispatch(
        authApi.endpoints.getVerification.initiate(undefined, { subscribe: false, forceRefetch: true }),
      );
      return landingPath(user, verificationFrom(result)) ?? AUTH_PATHS.verificationStatus;
    },
    [dispatch],
  );
}
