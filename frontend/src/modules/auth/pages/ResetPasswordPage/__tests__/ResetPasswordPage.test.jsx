import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { authMessages, commonMessages, ERROR_CODES } from '@real-estate/shared';
import { routes } from '../../../../../app/routes.jsx';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { AUTH_PATHS } from '../../../routes.jsx';

const TOKEN = 'reset-token-1';

const renderReset = (state = { resetToken: TOKEN }) =>
  renderWithProviders(routes, { initialEntries: [{ pathname: AUTH_PATHS.resetPassword, state }] });

const field = (label) => screen.getByLabelText(label, { selector: 'input' });

const failure = (status, code, message, fields) =>
  HttpResponse.json({ success: false, error: { code, message, fields } }, { status });

const changed = () =>
  HttpResponse.json({ success: true, data: { message: authMessages.api.passwordChanged } });

// Records the bodies of POST /auth/password/reset and answers with `response`.
function mockReset(response = changed) {
  const requests = [];
  server.use(
    http.post(apiUrl('/auth/password/reset'), async ({ request }) => {
      requests.push(await request.json());
      return response();
    }),
  );
  return requests;
}

async function fillPasswords(user, password = 'newSecret1', confirm = password) {
  await user.type(await screen.findByLabelText('New Password', { selector: 'input' }), password);
  await user.type(field('Confirm Password'), confirm);
}

describe('ResetPasswordPage', () => {
  it('shows the Figma heading, both password fields and Reset', async () => {
    renderReset();
    expect(await screen.findByRole('heading', { level: 1, name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByText('Create a strong password for your account.')).toBeInTheDocument();
    expect(field('New Password')).toHaveAttribute('type', 'password');
    expect(field('Confirm Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('sends a visitor without a reset token back to Forgot Password', async () => {
    const { router } = renderReset(null);
    expect(await screen.findByRole('heading', { name: 'Forgot Password?' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AUTH_PATHS.forgotPassword);
  });

  it('resets with the token and opens Log in with exactly { passwordChanged: true }', async () => {
    const user = userEvent.setup();
    const requests = mockReset();
    const { router, store } = renderReset();

    await fillPasswords(user);
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(await screen.findByRole('status')).toHaveTextContent(authMessages.api.passwordChanged);
    expect(requests).toEqual([{ resetToken: TOKEN, password: 'newSecret1', confirmPassword: 'newSecret1' }]);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.login);
    expect(router.state.location.state).toEqual({ passwordChanged: true });
    expect(store.getState().auth.accessToken).toBeNull();
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
  });

  it('shows the shared required messages and sends nothing', async () => {
    const user = userEvent.setup();
    const requests = mockReset();
    renderReset();

    await user.click(await screen.findByRole('button', { name: 'Reset' }));

    await waitFor(() =>
      expect(field('New Password')).toHaveAccessibleDescription(authMessages.password.required),
    );
    expect(field('Confirm Password')).toHaveAccessibleDescription(authMessages.confirmPassword.required);
    expect(requests).toHaveLength(0);
  });

  it.each([
    ['min', 'abc1', authMessages.password.min],
    ['letter', '12345678', authMessages.password.letter],
    ['digit', 'abcdefgh', authMessages.password.digit],
  ])('shows the shared password %s message', async (_rule, password, message) => {
    const user = userEvent.setup();
    const requests = mockReset();
    renderReset();

    await fillPasswords(user, password);
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(() => expect(field('New Password')).toHaveAccessibleDescription(message));
    expect(requests).toHaveLength(0);
  });

  it('shows the shared mismatch message on Confirm Password', async () => {
    const user = userEvent.setup();
    renderReset();

    await fillPasswords(user, 'newSecret1', 'newSecret2');
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(() =>
      expect(field('Confirm Password')).toHaveAccessibleDescription(authMessages.confirmPassword.mismatch),
    );
    expect(field('New Password')).not.toHaveAccessibleDescription();
  });

  it('sends the user back to Forgot Password with the API message when the token is refused (401)', async () => {
    const user = userEvent.setup();
    mockReset(() => failure(401, 'UNAUTHORIZED', authMessages.resetToken.required));
    const { router } = renderReset();

    await fillPasswords(user);
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(await screen.findByRole('heading', { name: 'Forgot Password?' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(authMessages.resetToken.required);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.forgotPassword);
    expect(router.state.location.state).toEqual({ resetError: authMessages.resetToken.required });
  });

  it('treats a resetToken field error the same way', async () => {
    const user = userEvent.setup();
    mockReset(() =>
      failure(422, 'VALIDATION_ERROR', commonMessages.invalidInput, {
        resetToken: [authMessages.resetToken.required],
      }),
    );
    renderReset();

    await fillPasswords(user);
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(await screen.findByRole('heading', { name: 'Forgot Password?' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(authMessages.resetToken.required);
  });

  it('shows a 422 password field message exactly as it arrives', async () => {
    const user = userEvent.setup();
    const serverMessage = 'Server says: password rejected (exact text)';
    mockReset(() =>
      failure(422, 'VALIDATION_ERROR', commonMessages.invalidInput, { password: [serverMessage] }),
    );
    renderReset();

    await fillPasswords(user);
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(() => expect(field('New Password')).toHaveAccessibleDescription(serverMessage));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows another API error in the form alert and stays', async () => {
    const user = userEvent.setup();
    mockReset(() => failure(429, 'TOO_MANY_REQUESTS', ERROR_CODES.TOO_MANY_REQUESTS.message));
    const { router } = renderReset();

    await fillPasswords(user);
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_CODES.TOO_MANY_REQUESTS.message);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.resetPassword);
  });

  it('disables Reset while the request is in flight', async () => {
    const user = userEvent.setup();
    let release;
    mockReset(
      () =>
        new Promise((resolve) => {
          release = () => resolve(changed());
        }),
    );
    const { router } = renderReset();

    await fillPasswords(user);
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(() => expect(release).toBeDefined());
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
    release();
    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.login));
  });
});
