import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { authMessages, commonMessages } from '@real-estate/shared';
import { routes } from '../../../../../app/routes.jsx';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { AUTH_PATHS } from '../../../routes.jsx';

const EMAIL = 'reset.me@example.test';

const renderVerify = (state = { email: EMAIL }) =>
  renderWithProviders(routes, { initialEntries: [{ pathname: AUTH_PATHS.verifyResetCode, state }] });

const failure = (status, code, message, fields) =>
  HttpResponse.json({ success: false, error: { code, message, fields } }, { status });

// Records the bodies sent to `path` and answers with `response`.
function mockPost(path, response) {
  const requests = [];
  server.use(
    http.post(apiUrl(path), async ({ request }) => {
      requests.push(await request.json());
      return response();
    }),
  );
  return requests;
}

async function typeCode(u, code) {
  await u.click(screen.getByRole('textbox', { name: 'Digit 1 of 6' }));
  await u.keyboard(code);
}

describe('VerifyResetCodePage', () => {
  it('shows the Verify frame with the email it sent the code to', async () => {
    renderVerify();
    expect(await screen.findByRole('heading', { name: 'Verify Your Account' })).toBeInTheDocument();
    expect(
      screen.getByText(`We’ve sent a 6-digit code to ${EMAIL}. Please enter it below to continue.`),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  it('sends a visitor without an email back to Forgot Password', async () => {
    const { router } = renderVerify(null);
    expect(await screen.findByRole('heading', { name: 'Forgot Password?' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AUTH_PATHS.forgotPassword);
  });

  it('verifies the code and opens Reset password with the token in the router state only', async () => {
    const u = userEvent.setup();
    const requests = mockPost('/auth/password/verify', () =>
      HttpResponse.json({ success: true, data: { resetToken: 'reset-token-1' } }),
    );
    const { router, store } = renderVerify();

    await typeCode(u, '012345');
    await u.click(screen.getByRole('button', { name: 'Verify' }));

    expect(await screen.findByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(requests).toEqual([{ email: EMAIL, code: '012345' }]);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.resetPassword);
    expect(router.state.location.search).toBe('');
    expect(router.state.location.state).toEqual({ resetToken: 'reset-token-1' });
    expect(store.getState().auth.accessToken).toBeNull();
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
  });

  it('shows the shared code message and sends nothing for an incomplete code', async () => {
    const u = userEvent.setup();
    const requests = mockPost('/auth/password/verify', () => HttpResponse.json({ success: true, data: {} }));
    renderVerify();

    await typeCode(u, '123');
    await u.click(screen.getByRole('button', { name: 'Verify' }));

    expect(await screen.findByText(authMessages.code.invalid)).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('shows 422 codeInvalid from the API exactly as returned', async () => {
    const u = userEvent.setup();
    mockPost('/auth/password/verify', () =>
      failure(422, 'VALIDATION_ERROR', commonMessages.invalidInput, { code: [authMessages.api.codeInvalid] }),
    );
    const { router } = renderVerify();

    await typeCode(u, '999999');
    await u.click(screen.getByRole('button', { name: 'Verify' }));

    expect(await screen.findByText(authMessages.api.codeInvalid)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AUTH_PATHS.verifyResetCode);
  });

  it('resends a password reset code to the same email', async () => {
    const u = userEvent.setup();
    const requests = mockPost('/auth/password/resend', () =>
      HttpResponse.json({ success: true, data: { sent: true } }),
    );
    renderVerify();

    await u.click(await screen.findByRole('button', { name: 'Resend' }));

    await waitFor(() => expect(requests).toEqual([{ email: EMAIL }]));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['resendTooSoon', authMessages.api.resendTooSoon(37)],
    ['resendLimit', authMessages.api.resendLimit],
  ])('shows the 429 %s message as returned', async (_name, message) => {
    const u = userEvent.setup();
    mockPost('/auth/password/resend', () => failure(429, 'TOO_MANY_REQUESTS', message));
    renderVerify();

    await u.click(await screen.findByRole('button', { name: 'Resend' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });
});
