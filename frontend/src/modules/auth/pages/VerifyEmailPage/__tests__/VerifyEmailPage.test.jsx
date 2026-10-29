import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { authMessages, commonMessages } from '@real-estate/shared';
import { routes } from '../../../../../app/routes.jsx';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { AUTH_PATHS } from '../../../routes.jsx';

const EMAIL = 'new.buyer@example.test';

const renderVerify = (state = { email: EMAIL }) =>
  renderWithProviders(routes, { initialEntries: [{ pathname: AUTH_PATHS.verifyEmail, state }] });

const user = (roles) => ({
  id: 7,
  fullName: 'Amira Khan',
  email: EMAIL,
  phone: '+971501234567',
  roles,
  emailVerified: true,
  preferredCountryCode: null,
  developerVerificationStatus: null,
});

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

const verified = (roles) => () =>
  HttpResponse.json({ success: true, data: { accessToken: 'access-token', user: user(roles) } });

async function typeCode(u, code) {
  await u.click(screen.getByRole('textbox', { name: 'Digit 1 of 6' }));
  await u.keyboard(code);
}

describe('VerifyEmailPage', () => {
  it('shows the email it sent the code to', async () => {
    renderVerify();
    expect(await screen.findByRole('heading', { name: 'Verify Your Account' })).toBeInTheDocument();
    expect(
      screen.getByText(`We’ve sent a 6-digit code to ${EMAIL}. Please enter it below to continue.`),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  it('sends a visitor without an email back to Sign up', async () => {
    renderVerify(null);
    expect(await screen.findByRole('heading', { name: 'Create Your Account' })).toBeInTheDocument();
  });

  it('verifies a Buyer, keeps the session in memory and opens Select a country', async () => {
    const u = userEvent.setup();
    const requests = mockPost('/auth/verify-email', verified(['buyer']));
    const { store } = renderVerify();

    await typeCode(u, '012345');
    await u.click(screen.getByRole('button', { name: 'Verify' }));

    expect(await screen.findByRole('heading', { name: 'Select a Country' })).toBeInTheDocument();
    expect(requests).toEqual([{ email: EMAIL, code: '012345' }]);
    expect(store.getState().auth).toEqual({ accessToken: 'access-token', user: user(['buyer']) });
  });

  it('verifies a Developer and opens Professional info', async () => {
    const u = userEvent.setup();
    mockPost('/auth/verify-email', verified(['developer']));
    renderVerify();

    await typeCode(u, '123456');
    await u.click(screen.getByRole('button', { name: 'Verify' }));

    expect(await screen.findByRole('heading', { name: 'Professional Information' })).toBeInTheDocument();
  });

  it('shows the shared messages for a missing or short code and sends nothing', async () => {
    const u = userEvent.setup();
    const requests = mockPost('/auth/verify-email', verified(['buyer']));
    renderVerify();

    await u.click(await screen.findByRole('button', { name: 'Verify' }));
    expect(await screen.findByText(authMessages.code.required)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Verification code' })).toHaveAccessibleDescription(
      authMessages.code.required,
    );

    await typeCode(u, '123');
    await u.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByText(authMessages.code.invalid)).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it.each([authMessages.api.codeInvalid, authMessages.api.codeTooManyAttempts])(
    'shows the 422 code message "%s" exactly as returned',
    async (message) => {
      const u = userEvent.setup();
      mockPost('/auth/verify-email', () =>
        failure(422, 'VALIDATION_ERROR', commonMessages.invalidInput, { code: [message] }),
      );
      const { store } = renderVerify();

      await typeCode(u, '999999');
      await u.click(screen.getByRole('button', { name: 'Verify' }));

      await waitFor(() =>
        expect(screen.getByRole('group', { name: 'Verification code' })).toHaveAccessibleDescription(message),
      );
      expect(store.getState().auth.accessToken).toBeNull();
    },
  );

  it('Resend asks for a new code for the same email', async () => {
    const u = userEvent.setup();
    const requests = mockPost('/auth/verify-email/resend', () =>
      HttpResponse.json({ success: true, data: { sent: true } }),
    );
    renderVerify();

    await u.click(await screen.findByRole('button', { name: 'Resend' }));

    await waitFor(() => expect(requests).toEqual([{ email: EMAIL }]));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([authMessages.api.resendTooSoon(42), authMessages.api.resendLimit])(
    'Resend shows the 429 message "%s" exactly as returned',
    async (message) => {
      const u = userEvent.setup();
      mockPost('/auth/verify-email/resend', () => failure(429, 'TOO_MANY_REQUESTS', message));
      renderVerify();

      await u.click(await screen.findByRole('button', { name: 'Resend' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(message);
    },
  );
});
