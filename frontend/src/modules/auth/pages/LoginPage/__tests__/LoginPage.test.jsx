import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { authMessages, commonMessages, ERROR_CODES } from '@real-estate/shared';
import { routes } from '../../../../../app/routes.jsx';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { AUTH_PATHS } from '../../../routes.jsx';

const EMAIL = 'sara@example.test';

const renderLogin = (entry = AUTH_PATHS.login) => renderWithProviders(routes, { initialEntries: [entry] });

const field = (label) => screen.getByLabelText(label, { selector: 'input' });

async function fillValidForm(user) {
  await user.type(await screen.findByLabelText('Email', { selector: 'input' }), '  Sara@Example.TEST ');
  await user.type(field('Password'), 'secret123');
}

// Records the body of POST /auth/login and answers with `response`.
function mockLogin(response) {
  const requests = [];
  server.use(
    http.post(apiUrl('/auth/login'), async ({ request }) => {
      requests.push(await request.json());
      return response();
    }),
  );
  return requests;
}

const userWith = (...roles) => ({
  id: 7,
  fullName: 'Sara Ali',
  email: EMAIL,
  phone: '+971501234567',
  roles,
  emailVerified: true,
  preferredCountryCode: null,
  developerVerificationStatus: roles.includes('developer') ? 'under_review' : null,
});

const loggedIn = (user) => () =>
  HttpResponse.json({ success: true, data: { accessToken: 'access-token-1', user } }, { status: 200 });

const failure = (status, code, message, fields) =>
  HttpResponse.json({ success: false, error: { code, message, fields } }, { status });

const heading = (name) => screen.findByRole('heading', { level: 1, name });

describe('LoginPage', () => {
  it('shows the Figma fields with the "Email" label, links, and no social buttons', async () => {
    renderLogin();
    expect(await heading('Welcome Back!')).toBeInTheDocument();
    expect(field('Email')).toHaveAttribute('type', 'email');
    expect(field('Password')).toHaveAttribute('type', 'password');
    expect(screen.queryByText(/Phone number/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forgot Password?' })).toHaveAttribute(
      'href',
      AUTH_PATHS.forgotPassword,
    );
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', AUTH_PATHS.signUp);
    expect(screen.queryByText(/Continue with/)).not.toBeInTheDocument();
    expect(screen.queryByText('or')).not.toBeInTheDocument();
  });

  it('logs a Buyer in with the normalised body, keeps the session in memory and opens Select a country', async () => {
    const user = userEvent.setup();
    const requests = mockLogin(loggedIn(userWith('buyer')));
    const { store, router } = renderLogin();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.selectCountry));
    expect(requests).toEqual([{ email: EMAIL, password: 'secret123' }]);
    expect(store.getState().auth).toEqual({
      accessToken: 'access-token-1',
      user: userWith('buyer'),
      restoringSession: false,
    });
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
  });

  it('opens Professional info for a Developer', async () => {
    const user = userEvent.setup();
    mockLogin(loggedIn(userWith('buyer', 'developer')));
    const { router } = renderLogin();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.professionalInfo));
  });

  it('shows the shared "required" messages and sends nothing', async () => {
    const user = userEvent.setup();
    const requests = mockLogin(loggedIn(userWith('buyer')));
    renderLogin();

    await user.click(await screen.findByRole('button', { name: 'Log In' }));

    await waitFor(() => expect(field('Email')).toHaveAccessibleDescription(authMessages.email.required));
    expect(field('Password')).toHaveAccessibleDescription(authMessages.password.required);
    expect(requests).toHaveLength(0);
  });

  it('shows the shared email format message', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(await screen.findByLabelText('Email', { selector: 'input' }), 'not-an-email');
    await user.type(field('Password'), 'x');
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => expect(field('Email')).toHaveAccessibleDescription(authMessages.email.invalid));
    expect(field('Password')).not.toHaveAccessibleDescription();
  });

  it('shows 401 invalidCredentials as the form alert, exactly as returned, and stays on Log in', async () => {
    const user = userEvent.setup();
    mockLogin(() => failure(401, 'UNAUTHORIZED', authMessages.api.invalidCredentials));
    const { store, router } = renderLogin();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(authMessages.api.invalidCredentials);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.login);
    expect(store.getState().auth.accessToken).toBeNull();
    expect(field('Email')).not.toHaveAccessibleDescription();
  });

  it('opens Verify with the email in the router state on 403 EMAIL_NOT_VERIFIED', async () => {
    const user = userEvent.setup();
    mockLogin(() => failure(403, 'EMAIL_NOT_VERIFIED', authMessages.api.emailNotVerified));
    const { store, router } = renderLogin();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await heading('Verify Your Account')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AUTH_PATHS.verifyEmail);
    expect(router.state.location.state).toEqual({ email: EMAIL });
    expect(screen.getByText(new RegExp(`code to ${EMAIL}\\.`))).toBeInTheDocument();
    expect(store.getState().auth.accessToken).toBeNull();
  });

  it('shows a 422 error.fields message on its field exactly as it arrives', async () => {
    const user = userEvent.setup();
    const serverMessage = 'Server says: this email is not accepted (exact text)';
    mockLogin(() =>
      failure(422, 'VALIDATION_ERROR', commonMessages.invalidInput, { email: [serverMessage] }),
    );
    renderLogin();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => expect(field('Email')).toHaveAccessibleDescription(serverMessage));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a non-field API error in the form alert', async () => {
    const user = userEvent.setup();
    mockLogin(() => failure(429, 'TOO_MANY_REQUESTS', ERROR_CODES.TOO_MANY_REQUESTS.message));
    renderLogin();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_CODES.TOO_MANY_REQUESTS.message);
  });

  it('disables Log In while the request is in flight', async () => {
    const user = userEvent.setup();
    let release;
    mockLogin(
      () =>
        new Promise((resolve) => {
          release = () => resolve(loggedIn(userWith('buyer'))());
        }),
    );
    const { router } = renderLogin();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => expect(release).toBeDefined());
    expect(screen.getByRole('button', { name: 'Log In' })).toBeDisabled();
    release();
    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.selectCountry));
  });

  it('shows passwordChanged when arriving from Reset password', async () => {
    renderLogin({ pathname: AUTH_PATHS.login, state: { passwordChanged: true } });

    expect(await screen.findByRole('status')).toHaveTextContent(authMessages.api.passwordChanged);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('replaces the passwordChanged notice with the error of a failed attempt', async () => {
    const user = userEvent.setup();
    mockLogin(() => failure(401, 'UNAUTHORIZED', authMessages.api.invalidCredentials));
    renderLogin({ pathname: AUTH_PATHS.login, state: { passwordChanged: true } });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(authMessages.api.invalidCredentials);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
