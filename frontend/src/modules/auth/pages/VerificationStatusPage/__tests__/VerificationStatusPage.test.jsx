import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ERROR_CODES } from '@real-estate/shared';
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

const FILES = {
  government_id: { fileName: 'License_Certificate.pdf', sizeBytes: 4_760_000 },
  company_registration_certificate: { fileName: 'Company_Certificate.pdf', sizeBytes: 1_048_576 },
  profile_photo: { fileName: 'Profile.png', sizeBytes: 524_288 },
};

// One GET /me/verification entry: { documentKind, status, rejectionReason } (+ the file it shows).
const doc = (documentKind, status, rejectionReason = null) => ({
  documentKind,
  status,
  rejectionReason,
  ...FILES[documentKind],
});

function mockVerification(documents, status = 'under_review') {
  server.use(
    http.get(apiUrl('/auth/me/verification'), () =>
      HttpResponse.json({ success: true, data: { status, documents } }),
    ),
  );
}

// `status` is the API's headline (DEC-035); the page shows it as given and never derives it.
const renderPage = (documents, status = 'under_review') => {
  mockVerification(documents, status);
  return renderWithProviders(routes, {
    initialEntries: [AUTH_PATHS.verificationStatus],
    preloadedState: { auth: { accessToken: 'access-1', user: DEVELOPER } },
  });
};

const heading = (name) => screen.findByRole('heading', { level: 1, name });
const documentList = () => screen.getByRole('list', { name: 'Uploaded Document' });
const items = () => within(documentList()).getAllByRole('listitem');

describe('VerificationStatusPage', () => {
  it('shows Under Review with every pending document and its badge (Individual: 2)', async () => {
    renderPage([doc('government_id', 'pending'), doc('profile_photo', 'pending')]);

    expect(await heading('Your Account is Under Review')).toBeInTheDocument();
    expect(screen.getByText(/approved within 24–48 hours/)).toBeInTheDocument();
    expect(
      screen.getByText('Thank you for submitting your documents. We’ll notify you shortly.'),
    ).toBeInTheDocument();
    expect(items()).toHaveLength(2);
    expect(within(items()[0]).getByText('License_Certificate.pdf')).toBeInTheDocument();
    expect(within(items()[0]).getByText('Size: 4.54 mb')).toBeInTheDocument();
    expect(within(items()[0]).getByText('Pending')).toBeInTheDocument();
    expect(within(items()[1]).getByText('Profile.png')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to login' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View plan' })).not.toBeInTheDocument();
  });

  it('shows Your Account is Active! when every required document is approved (Company: 3)', async () => {
    renderPage(
      [
        doc('government_id', 'approved'),
        doc('company_registration_certificate', 'approved'),
        doc('profile_photo', 'approved'),
      ],
      'active',
    );

    expect(await heading('Your Account is Active!')).toBeInTheDocument();
    expect(screen.getByText('Your verification documents have been approved.')).toBeInTheDocument();
    expect(items()).toHaveLength(3);
    for (const item of items()) expect(within(item).getByText('Approved')).toBeInTheDocument();
    expect(within(items()[1]).getByText('Company_Certificate.pdf')).toBeInTheDocument();
  });

  it('opens the Plans coming soon placeholder from View plan', async () => {
    const user = userEvent.setup();
    const { router } = renderPage(
      [doc('government_id', 'approved'), doc('profile_photo', 'approved')],
      'active',
    );

    await user.click(await screen.findByRole('button', { name: 'View plan' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Plans coming soon' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AUTH_PATHS.plans);
  });

  it('shows Verification Unsuccessful with each rejection reason exactly as written', async () => {
    const blurry = 'Document is blurry or unreadable';
    const expired = 'The certificate expired on 2025-01-01 – please send the renewed one.';
    renderPage(
      [
        doc('government_id', 'rejected', blurry),
        doc('company_registration_certificate', 'rejected', expired),
        doc('profile_photo', 'approved'),
      ],
      'unsuccessful',
    );

    expect(await heading('Verification Unsuccessful')).toBeInTheDocument();
    expect(screen.getByText(/could not be approved/)).toBeInTheDocument();
    expect(items()).toHaveLength(3);
    expect(within(items()[0]).getByText('Reject')).toBeInTheDocument();
    expect(items()[0]).toHaveTextContent(`Reject reason: ${blurry}`);
    expect(items()[1]).toHaveTextContent(`Reject reason: ${expired}`);
    expect(within(items()[2]).getByText('Approved')).toBeInTheDocument();
    expect(items()[2]).not.toHaveTextContent('Reject reason');
    expect(screen.queryByRole('button', { name: 'Back to login' })).not.toBeInTheDocument();
  });

  it.each([
    ['approved + pending', ['approved', 'pending'], 'under_review', 'Your Account is Under Review'],
    ['pending + rejected', ['pending', 'rejected'], 'unsuccessful', 'Verification Unsuccessful'],
    ['approved + rejected', ['approved', 'rejected'], 'unsuccessful', 'Verification Unsuccessful'],
  ])('mixed documents (%s) show the API status headline', async (_name, statuses, status, title) => {
    renderPage(
      [
        doc('government_id', statuses[0], statuses[0] === 'rejected' ? 'Wrong document' : null),
        doc('profile_photo', statuses[1], statuses[1] === 'rejected' ? 'Face not visible' : null),
      ],
      status,
    );

    expect(await heading(title)).toBeInTheDocument();
    const badges = { pending: 'Pending', approved: 'Approved', rejected: 'Reject' };
    expect(within(items()[0]).getByText(badges[statuses[0]])).toBeInTheDocument();
    expect(within(items()[1]).getByText(badges[statuses[1]])).toBeInTheDocument();
  });

  it('takes the headline from the API status, not from the document badges', async () => {
    // Not a combination the API sends today: it proves the page holds no copy of the rule.
    renderPage([doc('government_id', 'pending'), doc('profile_photo', 'pending')], 'active');

    expect(await heading('Your Account is Active!')).toBeInTheDocument();
    expect(within(items()[0]).getByText('Pending')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View plan' })).toBeInTheDocument();
  });

  it('Resubmit Documents opens Upload Document with only the rejected kinds', async () => {
    const user = userEvent.setup();
    const { router } = renderPage(
      [
        doc('government_id', 'approved'),
        doc('company_registration_certificate', 'pending'),
        doc('profile_photo', 'rejected', 'Face not visible'),
      ],
      'unsuccessful',
    );

    await user.click(await screen.findByRole('button', { name: 'Resubmit Documents' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Upload Documents' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AUTH_PATHS.uploadDocuments);
    expect(screen.getByRole('group', { name: 'Profile Photo' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Government ID' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Company Registration Certificate' })).not.toBeInTheDocument();
  });

  it('Back to login logs out (POST /auth/logout), clears the session and opens Log in', async () => {
    const user = userEvent.setup();
    const logouts = [];
    server.use(
      http.post(apiUrl('/auth/logout'), ({ request }) => {
        logouts.push(request.url);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { router, store } = renderPage([doc('government_id', 'pending'), doc('profile_photo', 'pending')]);

    await user.click(await screen.findByRole('button', { name: 'Back to login' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome Back!' })).toBeInTheDocument();
    expect(logouts).toHaveLength(1);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.login);
    expect(store.getState().auth).toEqual({ accessToken: null, user: null, restoringSession: false });
    expect(store.getState().api.queries).toEqual({});
  });

  it('Back to login still clears the local session when the logout request fails', async () => {
    const user = userEvent.setup();
    server.use(http.post(apiUrl('/auth/logout'), () => HttpResponse.error()));
    const { router, store } = renderPage([doc('government_id', 'pending'), doc('profile_photo', 'pending')]);

    await user.click(await screen.findByRole('button', { name: 'Back to login' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.login));
    expect(store.getState().auth.accessToken).toBeNull();
  });

  it('opens Upload Document while a required kind has nothing uploaded', async () => {
    const { router } = renderPage([
      doc('government_id', 'pending'),
      { documentKind: 'profile_photo', status: null, rejectionReason: null },
    ]);

    await waitFor(() => expect(router.state.location.pathname).toBe(AUTH_PATHS.uploadDocuments));
  });

  it('names a document by its kind when the entry has no file name', async () => {
    renderPage([
      { documentKind: 'government_id', status: 'pending', rejectionReason: null, sizeBytes: 1024 },
      doc('profile_photo', 'pending'),
    ]);

    expect(await heading('Your Account is Under Review')).toBeInTheDocument();
    expect(within(items()[0]).getByText('Government ID')).toBeInTheDocument();
  });

  it('hides the size line of an entry without sizeBytes (no "NaN mb")', async () => {
    renderPage([
      { documentKind: 'government_id', status: 'pending', rejectionReason: null },
      doc('profile_photo', 'pending'),
    ]);

    expect(await heading('Your Account is Under Review')).toBeInTheDocument();
    expect(items()[0]).not.toHaveTextContent('Size:');
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(within(items()[1]).getByText('Size: 0.50 mb')).toBeInTheDocument();
  });

  it('puts the status icon tile above the heading, through the layout icon slot', async () => {
    renderPage([doc('government_id', 'pending'), doc('profile_photo', 'pending')]);

    const title = await heading('Your Account is Under Review');
    const column = title.parentElement.parentElement;
    expect(column.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(column.firstElementChild.querySelector('img')).toHaveAttribute('alt', '');
    expect(column.children[1]).toBe(title.parentElement);
    expect(column.children[2]).toContainElement(documentList());
  });

  it('shows a 403 from GET /me/verification as returned', async () => {
    server.use(
      http.get(apiUrl('/auth/me/verification'), () =>
        HttpResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: ERROR_CODES.FORBIDDEN.message } },
          { status: 403 },
        ),
      ),
    );
    renderWithProviders(routes, {
      initialEntries: [AUTH_PATHS.verificationStatus],
      preloadedState: { auth: { accessToken: 'access-1', user: DEVELOPER } },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_CODES.FORBIDDEN.message);
  });
});
