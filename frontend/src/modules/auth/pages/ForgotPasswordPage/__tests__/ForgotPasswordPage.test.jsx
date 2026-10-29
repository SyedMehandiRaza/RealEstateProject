import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { authMessages, commonMessages } from '@real-estate/shared';
import { routes } from '../../../../../app/routes.jsx';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { AUTH_PATHS } from '../../../routes.jsx';

const EMAIL = 'reset.me@example.test';

const renderForgot = (state) =>
  renderWithProviders(routes, { initialEntries: [{ pathname: AUTH_PATHS.forgotPassword, state }] });

const emailField = () => screen.findByLabelText('Email', { selector: 'input' });

const failure = (status, code, message, fields) =>
  HttpResponse.json({ success: false, error: { code, message, fields } }, { status });

// Records the bodies of POST /auth/password/forgot and answers with `response`.
function mockForgot(response = () => HttpResponse.json({ success: true, data: { sent: true } })) {
  const requests = [];
  server.use(
    http.post(apiUrl('/auth/password/forgot'), async ({ request }) => {
      requests.push(await request.json());
      return response();
    }),
  );
  return requests;
}

describe('ForgotPasswordPage', () => {
  it('shows the Figma copy with "email address" only (DEC-022), the Email field and Send Code', async () => {
    renderForgot();
    expect(await screen.findByRole('heading', { level: 1, name: 'Forgot Password?' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Enter your registered email address, and we’ll send you a code to reset your password.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/phone number/i)).not.toBeInTheDocument();
    expect(await emailField()).toHaveAttribute('type', 'email');
    expect(screen.getByRole('button', { name: 'Send Code' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  });

  it('sends the normalised email and opens Verify with the email in the router state only', async () => {
    const user = userEvent.setup();
    const requests = mockForgot();
    const { router } = renderForgot();

    await user.type(await emailField(), '  Reset.Me@Example.TEST ');
    await user.click(screen.getByRole('button', { name: 'Send Code' }));

    expect(await screen.findByRole('heading', { name: 'Verify Your Account' })).toBeInTheDocument();
    expect(requests).toEqual([{ email: EMAIL }]);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.verifyResetCode);
    expect(router.state.location.search).toBe('');
    expect(router.state.location.state).toEqual({ email: EMAIL });
    expect(screen.getByText(new RegExp(`code to ${EMAIL}\\.`))).toBeInTheDocument();
  });

  it('shows the shared required and format messages and sends nothing', async () => {
    const user = userEvent.setup();
    const requests = mockForgot();
    renderForgot();

    await user.click(await screen.findByRole('button', { name: 'Send Code' }));
    await waitFor(async () =>
      expect(await emailField()).toHaveAccessibleDescription(authMessages.email.required),
    );

    await user.type(await emailField(), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send Code' }));
    await waitFor(async () =>
      expect(await emailField()).toHaveAccessibleDescription(authMessages.email.invalid),
    );
    expect(requests).toHaveLength(0);
  });

  it('shows a 429 resend message in the form alert exactly as returned', async () => {
    const user = userEvent.setup();
    mockForgot(() => failure(429, 'TOO_MANY_REQUESTS', authMessages.api.resendTooSoon(42)));
    const { router } = renderForgot();

    await user.type(await emailField(), EMAIL);
    await user.click(screen.getByRole('button', { name: 'Send Code' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(authMessages.api.resendTooSoon(42));
    expect(router.state.location.pathname).toBe(AUTH_PATHS.forgotPassword);
  });

  it('shows a 422 error.fields message on the Email field exactly as it arrives', async () => {
    const user = userEvent.setup();
    const serverMessage = 'Server says: email rejected (exact text)';
    mockForgot(() =>
      failure(422, 'VALIDATION_ERROR', commonMessages.invalidInput, { email: [serverMessage] }),
    );
    renderForgot();

    await user.type(await emailField(), EMAIL);
    await user.click(screen.getByRole('button', { name: 'Send Code' }));

    await waitFor(async () => expect(await emailField()).toHaveAccessibleDescription(serverMessage));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables Send Code while the request is in flight', async () => {
    const user = userEvent.setup();
    let release;
    mockForgot(
      () =>
        new Promise((resolve) => {
          release = () => resolve(HttpResponse.json({ success: true, data: { sent: true } }));
        }),
    );
    const { router } = renderForgot();

    await user.type(await emailField(), EMAIL);
    await user.click(screen.getByRole('button', { name: 'Send Code' }));

    await waitFor(() => expect(release).toBeDefined());
    expect(screen.getByRole('button', { name: 'Send Code' })).toBeDisabled();
    release();
    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.verifyResetCode));
  });

  it('shows the refused reset token message when Reset password sends the user back', async () => {
    renderForgot({ resetError: authMessages.resetToken.required });
    expect(await screen.findByRole('alert')).toHaveTextContent(authMessages.resetToken.required);
  });
});
