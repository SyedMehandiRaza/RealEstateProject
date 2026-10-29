import HomePage from '../pages/HomePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import { authRoutes } from '../modules/auth/routes.jsx';

// Add module routes here. Wrap pages that need a logged-in user in <ProtectedRoute />, e.g.
//   { element: <ProtectedRoute />, children: [{ path: '/dashboard', element: <DashboardPage /> }] }
export const routes = [
  { path: '/', element: <HomePage /> },
  ...authRoutes,
  { path: '*', element: <NotFoundPage /> },
];
