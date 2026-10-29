import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { authMessages, commonMessages, ERROR_CODES } from '@real-estate/shared';
import { routes } from '../../../../../app/routes.jsx';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { AUTH_PATHS } from '../../../routes.jsx';

const BUYER = {
  id: 7,
  fullName: 'Test Buyer',
  email: 'buyer@example.test',
  phone: '+971501234567',
  roles: ['buyer'],
  emailVerified: true,
  preferredCountryCode: null,
  developerVerificationStatus: null,
};

const renderPage = (user = BUYER) =>
  renderWithProviders(routes, {
    initialEntries: [AUTH_PATHS.selectCountry],
    preloadedState: { auth: { accessToken: 'access-1', user } },
  });

const failure = (status, code, message, fields) =>
  HttpResponse.json({ success: false, error: { code, message, fields } }, { status });

const saved = (body) =>
  HttpResponse.json({ success: true, data: { user: { ...BUYER, preferredCountryCode: body.countryCode } } });

// Records the bodies (and auth headers) of PUT /auth/me/country and answers with `response`.
function mockSelectCountry(response = saved) {
  const requests = [];
  server.use(
    http.put(apiUrl('/auth/me/country'), async ({ request }) => {
      const body = await request.json();
      requests.push({ body, authorization: request.headers.get('authorization') });
      return response(body);
    }),
  );
  return requests;
}

const radio = (name) => screen.getByRole('radio', { name });
const continueButton = () => screen.getByRole('button', { name: 'Continue' });

describe('SelectCountryPage', () => {
  it('shows the Figma heading, the four countries in order and Continue', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'Select a Country' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Choose the country where you want to explore properties. You can change it anytime later',
      ),
    ).toBeInTheDocument();
    const group = screen.getByRole('radiogroup', { name: 'Country' });
    expect(
      Array.from(group.querySelectorAll('input[type="radio"]')).map((input) => [
        input.value,
        input.labels[0].textContent,
      ]),
    ).toEqual([
      ['AE', 'United Arab Emirates'],
      ['SG', 'Singapore'],
      ['US', 'United States'],
      ['GB', 'United Kingdom'],
    ]);
    screen.getAllByRole('radio').forEach((input) => expect(input).not.toBeChecked());
    expect(continueButton()).toBeEnabled();
  });

  it('starts with the saved country selected', async () => {
    renderPage({ ...BUYER, preferredCountryCode: 'SG' });
    expect(await screen.findByRole('radio', { name: 'Singapore' })).toBeChecked();
  });

  it('saves the chosen country with the access token, stores the user and opens /', async () => {
    const user = userEvent.setup();
    const requests = mockSelectCountry();
    const { router, store } = renderPage();

    await user.click(await screen.findByRole('radio', { name: 'United Kingdom' }));
    await user.click(continueButton());

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(requests).toEqual([{ body: { countryCode: 'GB' }, authorization: 'Bearer access-1' }]);
    expect(store.getState().auth).toEqual({
      accessToken: 'access-1',
      user: { ...BUYER, preferredCountryCode: 'GB' },
    });
  });

  it('is keyboard-operable: Tab into the group, arrows move the selection, Enter submits', async () => {
    const user = userEvent.setup();
    const requests = mockSelectCountry();
    const { router } = renderPage({ ...BUYER, preferredCountryCode: 'AE' });

    await screen.findByRole('radio', { name: 'United Arab Emirates' });
    await user.tab(); // "Go back"
    await user.tab(); // the checked radio of the group
    expect(radio('United Arab Emirates')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(radio('Singapore')).toBeChecked();
    expect(radio('Singapore')).toHaveFocus();
    await user.keyboard('{Enter}');

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(requests.map((request) => request.body)).toEqual([{ countryCode: 'SG' }]);
  });

  it('shows the shared message when no country is selected and sends nothing', async () => {
    const user = userEvent.setup();
    const requests = mockSelectCountry();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Continue' }));

    const group = screen.getByRole('radiogroup', { name: 'Country' });
    await waitFor(() => expect(group).toHaveAccessibleDescription(authMessages.countryCode.invalid));
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(requests).toHaveLength(0);
  });

  it('shows a 422 countryCode message exactly as it arrives', async () => {
    const user = userEvent.setup();
    const serverMessage = 'Server says: country refused (exact text)';
    mockSelectCountry(() =>
      failure(422, 'VALIDATION_ERROR', commonMessages.invalidInput, { countryCode: [serverMessage] }),
    );
    const { router } = renderPage();

    await user.click(await screen.findByRole('radio', { name: 'United States' }));
    await user.click(continueButton());

    await waitFor(() =>
      expect(screen.getByRole('radiogroup', { name: 'Country' })).toHaveAccessibleDescription(serverMessage),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AUTH_PATHS.selectCountry);
  });

  it('shows a 403 FORBIDDEN message in the form alert and stays', async () => {
    const user = userEvent.setup();
    mockSelectCountry(() => failure(403, 'FORBIDDEN', ERROR_CODES.FORBIDDEN.message));
    const { router, store } = renderPage();

    await user.click(await screen.findByRole('radio', { name: 'United States' }));
    await user.click(continueButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_CODES.FORBIDDEN.message);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.selectCountry);
    expect(store.getState().auth.user).toEqual(BUYER);
  });

  it('disables Continue while the request is in flight', async () => {
    const user = userEvent.setup();
    let release;
    mockSelectCountry(
      (body) =>
        new Promise((resolve) => {
          release = () => resolve(saved(body));
        }),
    );
    const { router } = renderPage();

    await user.click(await screen.findByRole('radio', { name: 'Singapore' }));
    await user.click(continueButton());

    await waitFor(() => expect(release).toBeDefined());
    expect(continueButton()).toBeDisabled();
    release();
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });
});
