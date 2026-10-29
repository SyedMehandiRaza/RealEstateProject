import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import {
  authMessages,
  commonMessages,
  DEVELOPER_TYPES,
  ERROR_CODES,
  EXPERIENCE_LEVELS,
} from '@real-estate/shared';
import { routes } from '../../../../../app/routes.jsx';
import { apiUrl, server } from '../../../../../test/server.js';
import { renderWithProviders } from '../../../../../test/renderWithProviders.jsx';
import { AUTH_PATHS } from '../../../routes.jsx';

const DEVELOPER = {
  id: 9,
  fullName: 'Test Developer',
  email: 'developer@example.test',
  phone: '+971501234567',
  roles: ['developer'],
  emailVerified: true,
  preferredCountryCode: null,
  developerVerificationStatus: 'under_review',
};

const renderPage = (user = DEVELOPER) =>
  renderWithProviders(routes, {
    initialEntries: [AUTH_PATHS.professionalInfo],
    preloadedState: { auth: { accessToken: 'access-1', user } },
  });

const failure = (status, code, message, fields) =>
  HttpResponse.json({ success: false, error: { code, message, fields } }, { status });

const saved = (body) => HttpResponse.json({ success: true, data: { profile: { id: 3, ...body } } });

// Records the bodies (and auth headers) of PUT /auth/me/professional-profile and answers with `response`.
function mockSave(response = saved) {
  const requests = [];
  server.use(
    http.put(apiUrl('/auth/me/professional-profile'), async ({ request }) => {
      const body = await request.json();
      requests.push({ body, authorization: request.headers.get('authorization') });
      return response(body);
    }),
  );
  return requests;
}

const textbox = (name) => screen.getByRole('textbox', { name });
const combobox = (name) => screen.getByRole('combobox', { name: new RegExp(`^${name}`) });
const nextButton = () => screen.getByRole('button', { name: 'Next' });

async function choose(user, name, option) {
  await user.click(combobox(name));
  await user.click(screen.getByRole('option', { name: option }));
}

async function fillValid(user, { developerType = 'Individual', companyName } = {}) {
  if (companyName) await user.type(textbox('Company Name (optional)'), companyName);
  await choose(user, 'Type of Developer:', developerType);
  await user.type(textbox('License / Registration Number'), 'RERA-12345');
  await choose(user, 'Experience Level', '3–5');
  await user.type(textbox('Location'), 'Dubai Marina');
}

describe('ProfessionalInfoPage', () => {
  it('shows the Figma heading, fields, dropdown options in the shared order and Next', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Professional Information' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Add your agency or personal info to get verified and start managing listings and clients.',
      ),
    ).toBeInTheDocument();
    expect(textbox('Company Name (optional)')).toHaveAttribute('placeholder', 'Enter Name');
    expect(textbox('License / Registration Number')).toHaveAttribute(
      'placeholder',
      'Enter License / Registration Number',
    );
    expect(textbox('Location')).toHaveAttribute('placeholder', 'Enter Location');
    expect(combobox('Type of Developer:')).toHaveTextContent('Select');
    expect(combobox('Experience Level')).toHaveTextContent('Select');
    expect(nextButton()).toBeEnabled();

    await user.click(combobox('Type of Developer:'));
    let options = within(screen.getByRole('listbox', { name: 'Type of Developer:' })).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Individual', 'Company']);
    expect(DEVELOPER_TYPES).toHaveLength(options.length);
    await user.keyboard('{Escape}');

    await user.click(combobox('Experience Level'));
    options = within(screen.getByRole('listbox', { name: 'Experience Level' })).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['0–2', '3–5', '6–10', '10+']);
    expect(EXPERIENCE_LEVELS).toHaveLength(options.length);
  });

  it('saves an Individual without Company Name (shared enum values) and opens Upload Document', async () => {
    const user = userEvent.setup();
    const requests = mockSave();
    const { router } = renderPage();

    await screen.findByRole('heading', { name: 'Professional Information' });
    await fillValid(user);
    await user.click(nextButton());

    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.uploadDocuments));
    expect(requests).toEqual([
      {
        body: {
          developerType: 'individual',
          licenseNumber: 'RERA-12345',
          experienceLevel: '3_5',
          location: 'Dubai Marina',
        },
        authorization: 'Bearer access-1',
      },
    ]);
  });

  it('requires Company Name only for a Company', async () => {
    const user = userEvent.setup();
    const requests = mockSave();
    const { router } = renderPage();

    await screen.findByRole('heading', { name: 'Professional Information' });
    await fillValid(user, { developerType: 'Company' });
    await user.click(nextButton());

    const companyName = textbox('Company Name (optional)');
    await waitFor(() => expect(companyName).toHaveAccessibleDescription(authMessages.companyName.required));
    expect(companyName).toHaveAttribute('aria-invalid', 'true');
    expect(requests).toHaveLength(0);

    await choose(user, 'Type of Developer:', 'Individual');
    await user.click(nextButton());
    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.uploadDocuments));
    expect(requests.map((request) => request.body.developerType)).toEqual(['individual']);
  });

  it('saves a Company with its Company Name', async () => {
    const user = userEvent.setup();
    const requests = mockSave();
    const { router } = renderPage();

    await screen.findByRole('heading', { name: 'Professional Information' });
    await fillValid(user, { developerType: 'Company', companyName: '  Skyline Builders  ' });
    await user.click(nextButton());

    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.uploadDocuments));
    expect(requests[0].body).toEqual({
      companyName: 'Skyline Builders',
      developerType: 'company',
      licenseNumber: 'RERA-12345',
      experienceLevel: '3_5',
      location: 'Dubai Marina',
    });
  });

  it('shows the shared messages for every empty required field and sends nothing', async () => {
    const user = userEvent.setup();
    const requests = mockSave();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Next' }));

    await waitFor(() =>
      expect(combobox('Type of Developer:')).toHaveAccessibleDescription(authMessages.developerType.invalid),
    );
    expect(textbox('License / Registration Number')).toHaveAccessibleDescription(
      authMessages.licenseNumber.required,
    );
    expect(combobox('Experience Level')).toHaveAccessibleDescription(authMessages.experienceLevel.invalid);
    expect(textbox('Location')).toHaveAccessibleDescription(authMessages.location.required);
    expect(textbox('Company Name (optional)')).not.toHaveAttribute('aria-invalid');
    expect(requests).toHaveLength(0);
  });

  it('shows a 422 field message exactly as the server returns it', async () => {
    const user = userEvent.setup();
    const serverMessage = 'Server says: license refused (exact text)';
    mockSave(() =>
      failure(422, 'VALIDATION_ERROR', commonMessages.invalidInput, { licenseNumber: [serverMessage] }),
    );
    const { router } = renderPage();

    await screen.findByRole('heading', { name: 'Professional Information' });
    await fillValid(user);
    await user.click(nextButton());

    await waitFor(() =>
      expect(textbox('License / Registration Number')).toHaveAccessibleDescription(serverMessage),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AUTH_PATHS.professionalInfo);
  });

  it('shows a 403 FORBIDDEN message in the form alert and stays', async () => {
    const user = userEvent.setup();
    mockSave(() => failure(403, 'FORBIDDEN', ERROR_CODES.FORBIDDEN.message));
    const { router } = renderPage();

    await screen.findByRole('heading', { name: 'Professional Information' });
    await fillValid(user);
    await user.click(nextButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_CODES.FORBIDDEN.message);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.professionalInfo);
  });

  it('disables Next while the request is in flight', async () => {
    const user = userEvent.setup();
    let release;
    mockSave(
      (body) =>
        new Promise((resolve) => {
          release = () => resolve(saved(body));
        }),
    );
    const { router } = renderPage();

    await screen.findByRole('heading', { name: 'Professional Information' });
    await fillValid(user);
    await user.click(nextButton());

    await waitFor(() => expect(release).toBeDefined());
    expect(nextButton()).toBeDisabled();
    release();
    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.uploadDocuments));
  });

  it('is not shown to a buyer-only Account', async () => {
    const { router } = renderPage({ ...DEVELOPER, roles: ['buyer'], developerVerificationStatus: null });
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.queryByRole('heading', { name: 'Professional Information' })).not.toBeInTheDocument();
  });
});
