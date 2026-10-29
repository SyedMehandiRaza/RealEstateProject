import { screen } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute.jsx';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';

const routes = [
  { path: '/', element: <h1>Home</h1> },
  { path: '/login', element: <h1>Login</h1> },
  {
    element: <ProtectedRoute />,
    children: [{ path: '/dashboard', element: <h1>Dashboard</h1> }],
  },
  {
    element: <ProtectedRoute roles={['admin']} />,
    children: [{ path: '/admin', element: <h1>Admin</h1> }],
  },
];

const loggedIn = (...roles) => ({ auth: { accessToken: 'token', user: { id: 1, roles } } });

describe('ProtectedRoute', () => {
  it('redirects anonymous users to /login', async () => {
    renderWithProviders(routes, { initialEntries: ['/dashboard'] });
    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('renders the page for a logged-in user', async () => {
    renderWithProviders(routes, { initialEntries: ['/dashboard'], preloadedState: loggedIn('buyer') });
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('redirects home when the role is not allowed', async () => {
    renderWithProviders(routes, { initialEntries: ['/admin'], preloadedState: loggedIn('buyer') });
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders the page when one of the user roles is allowed', async () => {
    renderWithProviders(routes, { initialEntries: ['/admin'], preloadedState: loggedIn('buyer', 'admin') });
    expect(await screen.findByRole('heading', { name: 'Admin' })).toBeInTheDocument();
  });
});
