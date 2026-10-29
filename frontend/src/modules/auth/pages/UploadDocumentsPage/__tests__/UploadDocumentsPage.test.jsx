// Node's File: FormData under jest-fixed-jsdom is Node's and refuses jsdom's File (a browser has one File).
import { File } from 'node:buffer';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { authMessages, commonMessages, ERROR_CODES, ID_DOCUMENT_TYPES, LIMITS } from '@real-estate/shared';
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

const INDIVIDUAL_KINDS = ['government_id', 'profile_photo'];
const COMPANY_KINDS = ['government_id', 'company_registration_certificate', 'profile_photo'];

// GET /me/verification before the first submission: every required kind without a document.
const verificationOf = (kinds, status = null) => ({
  status: 'under_review',
  documents: kinds.map((documentKind) => ({ documentKind, status, rejectionReason: null })),
});

const PENDING = verificationOf(COMPANY_KINDS, 'pending');

const failure = (status, code, message, fields) =>
  HttpResponse.json({ success: false, error: { code, message, fields } }, { status });

function mockVerification(verification) {
  server.use(
    http.get(apiUrl('/auth/me/verification'), () => HttpResponse.json({ success: true, data: verification })),
  );
}

// Records each POST /auth/me/documents as { fields: { name: string | { name, type, size } }, ... }.
function mockSubmit(
  response = () => HttpResponse.json({ success: true, data: { verification: PENDING } }, { status: 201 }),
) {
  const requests = [];
  server.use(
    http.post(apiUrl('/auth/me/documents'), async ({ request }) => {
      const form = await request.formData();
      const fields = {};
      for (const [name, value] of form.entries()) {
        fields[name] =
          typeof value === 'string' ? value : { name: value.name, type: value.type, size: value.size };
      }
      requests.push({
        fields,
        contentType: request.headers.get('content-type'),
        authorization: request.headers.get('authorization'),
      });
      return response(fields);
    }),
  );
  return requests;
}

const renderPage = ({ kinds = COMPANY_KINDS, verification = verificationOf(kinds) } = {}) => {
  mockVerification(verification);
  return renderWithProviders(routes, {
    initialEntries: [AUTH_PATHS.uploadDocuments],
    preloadedState: { auth: { accessToken: 'access-1', user: DEVELOPER } },
  });
};

const pdf = (name = 'License_Certificate.pdf', size = 2048) =>
  new File([new Uint8Array(size)], name, { type: 'application/pdf' });
const png = (name = 'Profile.png', size = 1024) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' });

const fileInput = (label) => screen.getByLabelText(`${label} file`);
const typeSelect = () => screen.getByRole('combobox', { name: /^Government ID/ });
const nextButton = () => screen.getByRole('button', { name: 'Next' });
const slot = (name) => screen.getByRole('group', { name });

// The dropzone sets `accept`; applyAccept: false lets a wrong type through, as a drop would.
const setup = () => userEvent.setup({ applyAccept: false });

async function chooseIdType(user, label = 'Passport') {
  await user.click(typeSelect());
  await user.click(screen.getByRole('option', { name: label }));
}

async function fillCompany(user) {
  await chooseIdType(user);
  await user.upload(fileInput('Government ID'), pdf());
  await user.upload(
    fileInput('Company Registration Certificate'),
    pdf('Company Registration Certificate.pdf'),
  );
  await user.upload(fileInput('Profile Photo'), png());
}

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => 'blob:preview');
  URL.revokeObjectURL = jest.fn();
});

describe('UploadDocumentsPage', () => {
  it('shows the Figma heading and three slots for a Company, with the Profile Photo copy JPG, PNG', async () => {
    const user = setup();
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Upload Documents' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Upload the required documents to verify your identity and agency. This helps you gain trust and access all features.',
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('group')).toHaveLength(3));
    expect(slot('Government ID')).toBeInTheDocument();
    expect(slot('Company Registration Certificate')).toBeInTheDocument();
    expect(slot('Profile Photo')).toBeInTheDocument();
    expect(within(slot('Government ID')).getByText('Supported formats: PDF, JPG, PNG')).toBeInTheDocument();
    expect(within(slot('Profile Photo')).getByText('Supported formats: JPG, PNG')).toBeInTheDocument();
    expect(fileInput('Profile Photo')).toHaveAttribute('accept', 'image/jpeg,image/png');
    expect(typeSelect()).toHaveTextContent('Select Document Type');
    expect(nextButton()).toBeDisabled();

    await user.click(typeSelect());
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Driving License', 'Passport', 'PAN Card']);
    expect(ID_DOCUMENT_TYPES).toHaveLength(options.length);
  });

  it('shows two slots (no certificate) for an Individual', async () => {
    renderPage({ kinds: INDIVIDUAL_KINDS });

    await waitFor(() => expect(screen.getAllByRole('group')).toHaveLength(2));
    expect(screen.queryByRole('group', { name: 'Company Registration Certificate' })).not.toBeInTheDocument();
  });

  it('rejects a wrong type, a non-image Profile Photo, an empty file and a file over 10 MB before upload', async () => {
    const user = setup();
    const requests = mockSubmit();
    renderPage();
    await screen.findByRole('group', { name: 'Government ID' });

    await user.upload(fileInput('Government ID'), new File(['x'], 'notes.txt', { type: 'text/plain' }));
    expect(fileInput('Government ID')).toHaveAccessibleDescription(authMessages.mimeType.invalid);

    await user.upload(fileInput('Profile Photo'), pdf('photo.pdf'));
    expect(fileInput('Profile Photo')).toHaveAccessibleDescription(authMessages.mimeType.photo);

    await user.upload(
      fileInput('Company Registration Certificate'),
      new File([], 'empty.pdf', { type: 'application/pdf' }),
    );
    expect(fileInput('Company Registration Certificate')).toHaveAccessibleDescription(
      authMessages.sizeBytes.empty,
    );

    const tooBig = pdf('big.pdf', 1);
    Object.defineProperty(tooBig, 'size', { value: LIMITS.auth.maxFileBytes + 1 });
    await user.upload(fileInput('Company Registration Certificate'), tooBig);
    expect(fileInput('Company Registration Certificate')).toHaveAccessibleDescription(
      authMessages.sizeBytes.max,
    );

    expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();
    expect(nextButton()).toBeDisabled();
    expect(requests).toHaveLength(0);
  });

  it('shows the Uploaded card (name, size, x) and the x brings the dropzone back without a request', async () => {
    const user = setup();
    const requests = mockSubmit();
    renderPage({ kinds: INDIVIDUAL_KINDS });
    await screen.findByRole('group', { name: 'Profile Photo' });

    await user.upload(fileInput('Profile Photo'), png('Profile.png', 4.54 * 1024 * 1024));
    const photo = slot('Profile Photo');
    expect(within(photo).getByText('Profile.png')).toBeInTheDocument();
    expect(within(photo).getByText('Size: 4.54 mb')).toBeInTheDocument();
    expect(within(photo).queryByLabelText('Profile Photo file')).not.toBeInTheDocument();

    await user.click(within(photo).getByRole('button', { name: 'Remove Profile.png' }));
    expect(fileInput('Profile Photo')).toBeInTheDocument();
    expect(screen.queryByText('Profile.png')).not.toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('requires the Government ID type before sending', async () => {
    const user = setup();
    const requests = mockSubmit();
    renderPage({ kinds: INDIVIDUAL_KINDS });
    await screen.findByRole('group', { name: 'Government ID' });

    await user.upload(fileInput('Government ID'), pdf());
    await user.upload(fileInput('Profile Photo'), png());
    expect(nextButton()).toBeEnabled();
    await user.click(nextButton());

    expect(typeSelect()).toHaveAccessibleDescription(authMessages.idDocumentType.required);
    expect(requests).toHaveLength(0);
  });

  it('sends every file in one multipart request (field names per SPEC-001) and opens the status screen', async () => {
    const user = setup();
    const requests = mockSubmit(() =>
      HttpResponse.json({ success: true, data: { verification: PENDING } }, { status: 201 }),
    );
    const { router } = renderPage();
    await screen.findByRole('group', { name: 'Government ID' });

    await fillCompany(user);
    await user.click(nextButton());

    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.verificationStatus));
    expect(requests).toHaveLength(1);
    expect(requests[0].contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(requests[0].authorization).toBe('Bearer access-1');
    expect(requests[0].fields).toEqual({
      government_id: { name: 'License_Certificate.pdf', type: 'application/pdf', size: 2048 },
      company_registration_certificate: {
        name: 'Company Registration Certificate.pdf',
        type: 'application/pdf',
        size: 2048,
      },
      profile_photo: { name: 'Profile.png', type: 'image/png', size: 1024 },
      idDocumentType: 'passport',
    });
  });

  it('shows 422 per-file messages from documents.<kind>.<field> on their slots exactly as returned', async () => {
    const user = setup();
    const missing = 'Server says: upload your Company Registration Certificate (exact text)';
    mockSubmit(() =>
      failure(422, 'VALIDATION_ERROR', commonMessages.invalidInput, {
        'documents.government_id.mimeType': [authMessages.mimeType.invalid],
        'documents.government_id.idDocumentType': [authMessages.idDocumentType.required],
        'documents.company_registration_certificate.file': [missing],
      }),
    );
    const { router } = renderPage();
    await screen.findByRole('group', { name: 'Government ID' });

    await fillCompany(user);
    await user.click(nextButton());

    await waitFor(() =>
      expect(slot('Government ID')).toHaveAccessibleDescription(authMessages.mimeType.invalid),
    );
    expect(typeSelect()).toHaveAccessibleDescription(authMessages.idDocumentType.required);
    expect(slot('Company Registration Certificate')).toHaveAccessibleDescription(missing);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AUTH_PATHS.uploadDocuments);

    // Replacing the file clears its message.
    await user.click(
      within(slot('Company Registration Certificate')).getByRole('button', { name: /^Remove/ }),
    );
    expect(fileInput('Company Registration Certificate')).not.toHaveAccessibleDescription(missing);
  });

  it('shows a 409 CONFLICT message in the form alert and stays', async () => {
    const user = setup();
    const conflict = 'Server says: already under review (exact text)';
    mockSubmit(() => failure(409, 'CONFLICT', conflict));
    const { router } = renderPage();
    await screen.findByRole('group', { name: 'Government ID' });

    await fillCompany(user);
    await user.click(nextButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(conflict);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.uploadDocuments);
  });

  it('disables Next while the request is in flight', async () => {
    const user = setup();
    let release;
    mockSubmit(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve(HttpResponse.json({ success: true, data: { verification: PENDING } }, { status: 201 }));
        }),
    );
    const { router } = renderPage({ kinds: INDIVIDUAL_KINDS });
    await screen.findByRole('group', { name: 'Government ID' });

    await chooseIdType(user, 'PAN Card');
    await user.upload(fileInput('Government ID'), png('id.png'));
    await user.upload(fileInput('Profile Photo'), png());
    await user.click(nextButton());

    await waitFor(() => expect(release).toBeDefined());
    expect(nextButton()).toBeDisabled();
    release();
    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.verificationStatus));
  });

  it('offers only the rejected kinds on resubmission', async () => {
    renderPage({
      verification: {
        status: 'unsuccessful',
        documents: [
          { documentKind: 'government_id', status: 'approved', rejectionReason: null },
          { documentKind: 'profile_photo', status: 'rejected', rejectionReason: 'Blurry' },
        ],
      },
    });
    await waitFor(() => expect(screen.getAllByRole('group')).toHaveLength(1));
    expect(slot('Profile Photo')).toBeInTheDocument();
  });

  it('opens the status screen when every document is pending or approved', async () => {
    const { router } = renderPage({ verification: verificationOf(INDIVIDUAL_KINDS, 'pending') });
    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.verificationStatus));
  });

  it('shows a 403 from GET /me/verification in the form alert', async () => {
    server.use(
      http.get(apiUrl('/auth/me/verification'), () =>
        failure(403, 'FORBIDDEN', ERROR_CODES.FORBIDDEN.message),
      ),
    );
    renderWithProviders(routes, {
      initialEntries: [AUTH_PATHS.uploadDocuments],
      preloadedState: { auth: { accessToken: 'access-1', user: DEVELOPER } },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_CODES.FORBIDDEN.message);
    expect(nextButton()).toBeDisabled();
  });
});
