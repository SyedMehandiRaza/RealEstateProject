import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { authMessages, commonMessages } from '@real-estate/shared';
import { routes } from '../../../../../app/routes.jsx';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { AUTH_PATHS } from '../../../routes.jsx';

const EMAIL = 'new.buyer@example.test';

const renderSignUp = (path = AUTH_PATHS.signUp) => renderWithProviders(routes, { initialEntries: [path] });

const field = (label) => screen.getByLabelText(label, { selector: 'input' });

async function fillValidForm(user) {
  await user.type(field('Full Name'), 'Amira Khan');
  await user.type(field('Email'), '  New.Buyer@Example.TEST ');
  await user.type(field('Phone number'), '+971 50-123 4567');
  await user.type(field('Password'), 'secret123');
  await user.type(field('Confirm Password'), 'secret123');
}

// Records the body of POST /auth/sign-up and answers with `response`.
function mockSignUp(response) {
  const requests = [];
  server.use(
    http.post(apiUrl('/auth/sign-up'), async ({ request }) => {
      requests.push(await request.json());
      return response();
    }),
  );
  return requests;
}

const created = () => HttpResponse.json({ success: true, data: { email: EMAIL } }, { status: 201 });

const failure = (status, code, message, fields) =>
  HttpResponse.json({ success: false, error: { code, message, fields } }, { status });

describe('SignUpPage', () => {
  it('shows the Buyer and Developers tabs, without the Agent tab', async () => {
    renderSignUp();
    expect(await screen.findByRole('heading', { name: 'Create Your Account' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Buyer' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Developers' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.queryByRole('tab', { name: 'Agent' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Continue with/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', AUTH_PATHS.login);
  });

  it('signs up a Buyer with the normalised body and opens Verify with the email', async () => {
    const user = userEvent.setup();
    const requests = mockSignUp(created);
    renderSignUp();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByRole('heading', { name: 'Verify Your Account' })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`code to ${EMAIL}\\.`))).toBeInTheDocument();
    expect(requests).toEqual([
      {
        role: 'buyer',
        fullName: 'Amira Khan',
        email: EMAIL,
        phone: '+971501234567',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    ]);
  });

  it('signs up a Developer from the Developers tab', async () => {
    const user = userEvent.setup();
    const requests = mockSignUp(created);
    const { router } = renderSignUp();

    await user.click(await screen.findByRole('tab', { name: 'Developers' }));
    expect(screen.getByRole('tab', { name: 'Developers' })).toHaveAttribute('aria-selected', 'true');
    expect(router.state.location.search).toBe('?role=developer');

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await screen.findByRole('heading', { name: 'Verify Your Account' });
    expect(requests[0].role).toBe('developer');
  });

  it('opens on the Developers tab from /sign-up?role=developer', async () => {
    const user = userEvent.setup();
    const requests = mockSignUp(created);
    renderSignUp(`${AUTH_PATHS.signUp}?role=developer`);

    expect(await screen.findByRole('tab', { name: 'Developers' })).toHaveAttribute('aria-selected', 'true');
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await screen.findByRole('heading', { name: 'Verify Your Account' });
    expect(requests[0].role).toBe('developer');
  });

  it('shows the shared "required" message under every empty field and sends nothing', async () => {
    const user = userEvent.setup();
    const requests = mockSignUp(created);
    renderSignUp();

    await user.click(await screen.findByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText(authMessages.fullName.required)).toBeInTheDocument();
    expect(field('Full Name')).toHaveAccessibleDescription(authMessages.fullName.required);
    expect(field('Email')).toHaveAccessibleDescription(authMessages.email.required);
    expect(field('Phone number')).toHaveAccessibleDescription(authMessages.phone.required);
    expect(field('Password')).toHaveAccessibleDescription(authMessages.password.required);
    expect(field('Confirm Password')).toHaveAccessibleDescription(authMessages.confirmPassword.required);
    expect(requests).toHaveLength(0);
  });

  it('shows the shared format and policy messages', async () => {
    const user = userEvent.setup();
    renderSignUp();

    await user.type(await screen.findByLabelText('Full Name', { selector: 'input' }), 'A');
    await user.type(field('Email'), 'not-an-email');
    await user.type(field('Phone number'), '0501234567');
    await user.type(field('Password'), 'onlyletters');
    await user.type(field('Confirm Password'), 'different1');
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText(authMessages.fullName.min)).toBeInTheDocument();
    expect(screen.getByText(authMessages.email.invalid)).toBeInTheDocument();
    expect(screen.getByText(authMessages.phone.invalid)).toBeInTheDocument();
    expect(screen.getByText(authMessages.password.digit)).toBeInTheDocument();
    expect(screen.getByText(authMessages.confirmPassword.mismatch)).toBeInTheDocument();
  });

  it('shows 409 emailTaken on the Email field', async () => {
    const user = userEvent.setup();
    mockSignUp(() =>
      failure(409, 'CONFLICT', 'This record already exists', { email: [authMessages.api.emailTaken] }),
    );
    renderSignUp();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => expect(field('Email')).toHaveAccessibleDescription(authMessages.api.emailTaken));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a server error.fields message exactly as it arrives', async () => {
    const user = userEvent.setup();
    const serverMessage = 'Server says: this phone number is not accepted (exact text)';
    mockSignUp(() =>
      failure(422, 'VALIDATION_ERROR', commonMessages.invalidInput, { phone: [serverMessage] }),
    );
    renderSignUp();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => expect(field('Phone number')).toHaveAccessibleDescription(serverMessage));
    expect(screen.getByText(serverMessage)).toBeInTheDocument();
  });

  it('shows a non-field API error in the form alert', async () => {
    const user = userEvent.setup();
    mockSignUp(() => failure(429, 'TOO_MANY_REQUESTS', 'Too many requests, please try again later'));
    renderSignUp();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests, please try again later');
  });

  it('disables Sign Up while the request is in flight', async () => {
    const user = userEvent.setup();
    let release;
    mockSignUp(
      () =>
        new Promise((resolve) => {
          release = () => resolve(created());
        }),
    );
    renderSignUp();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => expect(release).toBeDefined());
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeDisabled();
    release();
    expect(await screen.findByRole('heading', { name: 'Verify Your Account' })).toBeInTheDocument();
  });
});
