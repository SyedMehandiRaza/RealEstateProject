import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router';
import { selectCurrentUser, selectIsAuthenticated } from '../../modules/auth/store/authSlice.js';

// Route guard for the UI only; the API enforces authorization on every request.
export default function ProtectedRoute({ roles, redirectTo = '/login' }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }
  if (roles && !roles.some((role) => user?.roles?.includes(role))) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
