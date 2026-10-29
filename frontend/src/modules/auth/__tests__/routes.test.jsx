import { screen } from '@testing-library/react';
import { routes } from '../../../app/routes.jsx';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { AUTH_PATHS } from '../routes.jsx';
import { authApi } from '../api/authApi.js';
import { baseApi } from '../../../services/api/baseApi.js';

const loggedIn = (...roles) => ({ auth: { accessToken: 'token', user: { id: 1, roles } } });

const heading = (name) => screen.findByRole('heading', { level: 1, name });

describe('auth routes', () => {
  it.each([
    [AUTH_PATHS.login, 'Welcome Back!'],
    [AUTH_PATHS.signUp, 'Create Your Account'],
    [AUTH_PATHS.forgotPassword, 'Forgot Password'],
    [AUTH_PATHS.verifyResetCode, 'Verify Your Account'],
    [AUTH_PATHS.resetPassword, 'Reset Password'],
  ])('public route %s resolves to its page', async (path, title) => {
    renderWithProviders(routes, { initialEntries: [path] });
    expect(await heading(title)).toBeInTheDocument();
  });

  it('Verify email resolves when the email comes in the router state', async () => {
    renderWithProviders(routes, {
      initialEntries: [{ pathname: AUTH_PATHS.verifyEmail, state: { email: 'new.buyer@example.test' } }],
    });
    expect(await heading('Verify Your Account')).toBeInTheDocument();
  });

  it('Select a country is for buyers', async () => {
    renderWithProviders(routes, {
      initialEntries: [AUTH_PATHS.selectCountry],
      preloadedState: loggedIn('buyer'),
    });
    expect(await heading('Select a country')).toBeInTheDocument();
  });

  it.each([
    [AUTH_PATHS.professionalInfo, 'Professional info'],
    [AUTH_PATHS.uploadDocuments, 'Upload Document'],
    [AUTH_PATHS.verificationStatus, 'Verification status'],
  ])('developer route %s resolves for a developer', async (path, title) => {
    renderWithProviders(routes, { initialEntries: [path], preloadedState: loggedIn('developer') });
    expect(await heading(title)).toBeInTheDocument();
  });

  it('sends an anonymous visitor of an onboarding route to Log in', async () => {
    renderWithProviders(routes, { initialEntries: [AUTH_PATHS.professionalInfo] });
    expect(await heading('Welcome Back!')).toBeInTheDocument();
  });

  it('sends a buyer-only account away from developer routes', async () => {
    renderWithProviders(routes, {
      initialEntries: [AUTH_PATHS.uploadDocuments],
      preloadedState: loggedIn('buyer'),
    });
    expect(await heading('Real Estate')).toBeInTheDocument();
  });

  it('authApi is injected into baseApi', () => {
    expect(authApi).toBe(baseApi);
  });
});
