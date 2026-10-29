import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { routes } from '../../../app/routes.jsx';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { apiUrl, server } from '../../../test/server.js';
import { AUTH_PATHS } from '../routes.jsx';
import { authApi } from '../api/authApi.js';
import { baseApi } from '../../../services/api/baseApi.js';

const loggedIn = (...roles) => ({ auth: { accessToken: 'token', user: { id: 1, roles } } });

const heading = (name) => screen.findByRole('heading', { level: 1, name });

describe('auth routes', () => {
  it.each([
    [AUTH_PATHS.login, 'Welcome Back!'],
    [AUTH_PATHS.signUp, 'Create Your Account'],
    [AUTH_PATHS.forgotPassword, 'Forgot Password?'],
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

  it('the password reset Verify resolves with the email in the router state', async () => {
    renderWithProviders(routes, {
      initialEntries: [{ pathname: AUTH_PATHS.verifyResetCode, state: { email: 'reset.me@example.test' } }],
    });
    expect(await heading('Verify Your Account')).toBeInTheDocument();
  });

  it('Reset password resolves with a reset token in the router state', async () => {
    renderWithProviders(routes, {
      initialEntries: [{ pathname: AUTH_PATHS.resetPassword, state: { resetToken: 'reset-token' } }],
    });
    expect(await heading('Reset Password')).toBeInTheDocument();
  });

  it('Select a country is for buyers', async () => {
    renderWithProviders(routes, {
      initialEntries: [AUTH_PATHS.selectCountry],
      preloadedState: loggedIn('buyer'),
    });
    expect(await heading('Select a Country')).toBeInTheDocument();
  });

  it('sends a developer-only account away from Select a country', async () => {
    renderWithProviders(routes, {
      initialEntries: [AUTH_PATHS.selectCountry],
      preloadedState: loggedIn('developer'),
    });
    expect(await heading('Real Estate')).toBeInTheDocument();
  });

  it.each([
    [AUTH_PATHS.professionalInfo, 'Professional Information'],
    [AUTH_PATHS.uploadDocuments, 'Upload Documents'],
    [AUTH_PATHS.plans, 'Plans coming soon'],
  ])('developer route %s resolves for a developer', async (path, title) => {
    server.use(
      http.get(apiUrl('/auth/me/verification'), () =>
        HttpResponse.json({
          success: true,
          data: {
            status: 'under_review',
            documents: [{ documentKind: 'government_id', status: null, rejectionReason: null }],
          },
        }),
      ),
    );
    renderWithProviders(routes, { initialEntries: [path], preloadedState: loggedIn('developer') });
    expect(await heading(title)).toBeInTheDocument();
  });

  it('the status route resolves for a developer with submitted documents', async () => {
    server.use(
      http.get(apiUrl('/auth/me/verification'), () =>
        HttpResponse.json({
          success: true,
          data: {
            status: 'under_review',
            documents: [
              {
                documentKind: 'government_id',
                status: 'pending',
                rejectionReason: null,
                fileName: 'id.pdf',
                sizeBytes: 1024,
              },
            ],
          },
        }),
      ),
    );
    renderWithProviders(routes, {
      initialEntries: [AUTH_PATHS.verificationStatus],
      preloadedState: loggedIn('developer'),
    });
    expect(await heading('Your Account is Under Review')).toBeInTheDocument();
  });

  it.each([AUTH_PATHS.verificationStatus, AUTH_PATHS.plans])(
    'sends a buyer-only account away from %s',
    async (path) => {
      renderWithProviders(routes, { initialEntries: [path], preloadedState: loggedIn('buyer') });
      expect(await heading('Real Estate')).toBeInTheDocument();
    },
  );

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
