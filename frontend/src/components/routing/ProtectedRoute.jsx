import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsRestoringSession,
} from '../../modules/auth/store/authSlice.js';

// Route guard for the UI only; the API enforces authorization on every request.
// While the app-start session restore runs (TASK-049) it renders a blank, busy status instead of
// deciding, so a reload on a protected page keeps the user there once the refresh succeeds.
export default function ProtectedRoute({ roles, redirectTo = '/login' }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isRestoringSession = useSelector(selectIsRestoringSession);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (!isAuthenticated && isRestoringSession) {
    return <div role="status" aria-busy="true" aria-label="Loading" />;
  }
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }
  if (roles && !roles.some((role) => user?.roles?.includes(role))) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
