import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';
import { useGetVerificationQuery } from '../api/authApi.js';
import { developerFlowOpen, outOfOrderRedirect, verificationFrom } from '../hooks/landing.js';
import { AUTH_PATHS } from '../routes.jsx';
import { selectCurrentUser } from '../store/authSlice.js';

// Wraps an onboarding page (inside ProtectedRoute) and sends the Account to its first unfinished step
// when the page is opened out of order (hooks/landing.js, TASK-041), e.g. Upload Document before
// Professional info, the status screen with a document missing, or Select a country while a dual-role
// Account is still in the developer flow. Upload Document and the status screen render while
// GET /me/verification loads (they show their own loading state from the same cached query); Select a
// country waits, so it never flashes for an Account that will be sent on. A non-403 error renders the
// page, which shows it.
export default function OnboardingGuard({ page, children }) {
  const user = useSelector(selectCurrentUser);
  const needsVerification = developerFlowOpen(user) && page !== AUTH_PATHS.professionalInfo;
  const { data, error, isFetching } = useGetVerificationQuery(undefined, { skip: !needsVerification });

  // A 403 counts only once no refetch is running (a stale cached 403 is never acted on mid-refetch).
  const verification = needsVerification
    ? verificationFrom({ data, error: isFetching ? undefined : error })
    : undefined;
  const target = outOfOrderRedirect(page, user, verification);
  if (target) return <Navigate to={target} replace />;

  const waiting =
    needsVerification &&
    verification === undefined &&
    (isFetching || !error) &&
    page === AUTH_PATHS.selectCountry;
  if (waiting) return <div role="status" aria-busy="true" aria-label="Loading" />;
  return children;
}
