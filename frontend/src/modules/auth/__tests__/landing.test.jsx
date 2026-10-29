import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ERROR_CODES } from '@real-estate/shared';
import { makeStore } from '../../../app/store.js';
import { routes } from '../../../app/routes.jsx';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { apiUrl, server } from '../../../test/server.js';
import { restoreSession } from '../api/restoreSession.js';
import { AUTH_PATHS } from '../routes.jsx';

// TASK-041 (Q-034, DEC-039): every Account resumes onboarding at its first unfinished step, after Log in,
// Verify email, Select a country and a reload, and an onboarding page opened out of order sends it there.

const account = ({ roles, country = null, status } = {}) => ({
  id: 7,
  fullName: 'Sara Ali',
  email: 'sara@example.test',
  phone: '+971501234567',
  roles,
  emailVerified: true,
  preferredCountryCode: country,
  developerVerificationStatus: roles.includes('developer') ? (status ?? 'under_review') : null,
});

const BUYER = account({ roles: ['buyer'] });
const BUYER_WITH_COUNTRY = account({ roles: ['buyer'], country: 'AE' });
const DEVELOPER = account({ roles: ['developer'] });
const ACTIVE_DEVELOPER = account({ roles: ['developer'], status: 'active' });
const DUAL = account({ roles: ['buyer', 'developer'] });
const ACTIVE_DUAL = account({ roles: ['buyer', 'developer'], status: 'active' });
const ACTIVE_DUAL_WITH_COUNTRY = account({ roles: ['buyer', 'developer'], status: 'active', country: 'GB' });

const entry = (documentKind, status) => ({
  documentKind,
  status,
  rejectionReason: status === 'rejected' ? 'Blurry' : null,
  fileName: status ? `${documentKind}.pdf` : null,
  sizeBytes: status ? 2048 : null,
});
const verification = (status, ...entries) => ({ success: true, data: { status, documents: entries } });

// GET /me/verification answers, as the API sends them.
const NO_PROFILE = () =>
  HttpResponse.json(
    { success: false, error: { code: 'FORBIDDEN', message: ERROR_CODES.FORBIDDEN.message } },
    { status: 403 },
  );
const DOCUMENTS_MISSING = () =>
  HttpResponse.json(verification('under_review', entry('government_id', null), entry('profile_photo', null)));
const ONE_MISSING = () =>
  HttpResponse.json(
    verification('under_review', entry('government_id', 'pending'), entry('profile_photo', null)),
  );
const PENDING = () =>
  HttpResponse.json(
    verification('under_review', entry('government_id', 'pending'), entry('profile_photo', 'pending')),
  );
const REJECTED = () =>
  HttpResponse.json(
    verification('unsuccessful', entry('government_id', 'approved'), entry('profile_photo', 'rejected')),
  );
const ACTIVE = () =>
  HttpResponse.json(
    verification('active', entry('government_id', 'approved'), entry('profile_photo', 'approved')),
  );
const SERVER_ERROR = () =>
  HttpResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: ERROR_CODES.INTERNAL_ERROR.message } },
    { status: 500 },
  );

// Answers GET /me/verification with `respond` and counts the requests.
function mockVerification(respond) {
  const calls = { count: 0 };
  server.use(
    http.get(apiUrl('/auth/me/verification'), () => {
      calls.count += 1;
      return respond();
    }),
  );
  return calls;
}

const session = (user) => () => HttpResponse.json({ success: true, data: { accessToken: 'access-1', user } });

const path = (router) => router.state.location.pathname;
const heading = (name) => screen.findByRole('heading', { level: 1, name });

async function logIn(user) {
  server.use(http.post(apiUrl('/auth/login'), session(user)));
  const result = renderWithProviders(routes, { initialEntries: [AUTH_PATHS.login] });
  const u = userEvent.setup();
  await u.type(await screen.findByLabelText('Email', { selector: 'input' }), 'sara@example.test');
  await u.type(screen.getByLabelText('Password', { selector: 'input' }), 'secret123');
  await u.click(screen.getByRole('button', { name: 'Log In' }));
  return { ...result, u };
}

const openAs = (user, page) =>
  renderWithProviders(routes, {
    initialEntries: [page],
    preloadedState: { auth: { accessToken: 'access-1', user } },
  });

// What main.jsx does on a page load: start the session restore, then render the reloaded URL.
function reloadAt(page, user) {
  server.use(http.post(apiUrl('/auth/refresh'), session(user)));
  const store = makeStore();
  restoreSession(store.dispatch);
  const router = createMemoryRouter(routes, { initialEntries: [page] });
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return { store, router };
}

describe('landing after Log in', () => {
  it.each([
    ['a Buyer without a country', BUYER, null, AUTH_PATHS.selectCountry],
    ['a Buyer with a country', BUYER_WITH_COUNTRY, null, '/'],
    ['a Developer without Professional info', DEVELOPER, NO_PROFILE, AUTH_PATHS.professionalInfo],
    ['a Developer with no documents', DEVELOPER, DOCUMENTS_MISSING, AUTH_PATHS.uploadDocuments],
    ['a Developer with one document missing', DEVELOPER, ONE_MISSING, AUTH_PATHS.uploadDocuments],
    ['a Developer Under Review', DEVELOPER, PENDING, AUTH_PATHS.verificationStatus],
    ['a Developer Unsuccessful', DEVELOPER, REJECTED, AUTH_PATHS.verificationStatus],
    ['a Developer the API now reports Active', DEVELOPER, ACTIVE, '/'],
    ['a dual-role Account without Professional info', DUAL, NO_PROFILE, AUTH_PATHS.professionalInfo],
    ['a dual-role Account Under Review', DUAL, PENDING, AUTH_PATHS.verificationStatus],
    ['a dual-role Account that turned Active, no country', DUAL, ACTIVE, AUTH_PATHS.selectCountry],
  ])('%s lands on its first unfinished step', async (_case, user, respond, expected) => {
    const calls = mockVerification(respond ?? NO_PROFILE);
    const { router } = await logIn(user);

    await waitFor(() => expect(path(router)).toBe(expected));
    // Only an open developer flow needs GET /me/verification.
    expect(calls.count > 0).toBe(respond !== null);
  });

  it.each([
    ['an Active Developer', ACTIVE_DEVELOPER, '/'],
    ['an Active dual-role Account without a country', ACTIVE_DUAL, AUTH_PATHS.selectCountry],
    ['an Active dual-role Account with a country', ACTIVE_DUAL_WITH_COUNTRY, '/'],
  ])('%s lands from the user alone, with no verification request', async (_case, user, expected) => {
    const calls = mockVerification(PENDING);
    const { router } = await logIn(user);

    await waitFor(() => expect(path(router)).toBe(expected));
    expect(calls.count).toBe(0);
  });

  it('opens the status screen, which shows the error, when GET /me/verification fails', async () => {
    mockVerification(SERVER_ERROR);
    const { router } = await logIn(DEVELOPER);

    await waitFor(() => expect(path(router)).toBe(AUTH_PATHS.verificationStatus));
    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_CODES.INTERNAL_ERROR.message);
  });

  it('keeps Log In disabled while the landing is resolved', async () => {
    let release;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    server.use(
      http.get(apiUrl('/auth/me/verification'), async () => {
        await held;
        return PENDING();
      }),
    );
    const { router } = await logIn(DEVELOPER);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Log In' })).toBeDisabled());
    expect(path(router)).toBe(AUTH_PATHS.login);
    await act(async () => release());
    await waitFor(() => expect(path(router)).toBe(AUTH_PATHS.verificationStatus));
  });

  it('after saving Professional info, Upload Document opens (the cached 403 is dropped)', async () => {
    let hasProfile = false;
    mockVerification(() => (hasProfile ? DOCUMENTS_MISSING() : NO_PROFILE()));
    server.use(
      http.put(apiUrl('/auth/me/professional-profile'), async ({ request }) => {
        hasProfile = true;
        return HttpResponse.json({ success: true, data: { profile: { id: 3, ...(await request.json()) } } });
      }),
    );
    const { router, u } = await logIn(DEVELOPER);
    expect(await heading('Professional Information')).toBeInTheDocument();
    expect(path(router)).toBe(AUTH_PATHS.professionalInfo);

    const choose = async (name, option) => {
      await u.click(screen.getByRole('combobox', { name: new RegExp(`^${name}`) }));
      await u.click(screen.getByRole('option', { name: option }));
    };
    await choose('Type of Developer:', 'Individual');
    await u.type(screen.getByRole('textbox', { name: 'License / Registration Number' }), 'RERA-12345');
    await choose('Experience Level', '3–5');
    await u.type(screen.getByRole('textbox', { name: 'Location' }), 'Dubai Marina');
    await u.click(screen.getByRole('button', { name: 'Next' }));

    expect(await heading('Upload Documents')).toBeInTheDocument();
    expect(await screen.findAllByRole('group')).toHaveLength(2);
    expect(path(router)).toBe(AUTH_PATHS.uploadDocuments);
  });
});

describe('landing after Verify email', () => {
  const verifyAs = async (user) => {
    server.use(http.post(apiUrl('/auth/verify-email'), session(user)));
    const result = renderWithProviders(routes, {
      initialEntries: [{ pathname: AUTH_PATHS.verifyEmail, state: { email: user.email } }],
    });
    const u = userEvent.setup();
    await u.click(await screen.findByRole('textbox', { name: 'Digit 1 of 6' }));
    await u.keyboard('123456');
    await u.click(screen.getByRole('button', { name: 'Verify' }));
    return result;
  };

  it.each([
    ['a new Buyer', BUYER, null, AUTH_PATHS.selectCountry],
    ['a new Developer', DEVELOPER, NO_PROFILE, AUTH_PATHS.professionalInfo],
    ['a new dual-role Account', DUAL, NO_PROFILE, AUTH_PATHS.professionalInfo],
    [
      'a Developer who already has documents (verified from Log in)',
      DEVELOPER,
      PENDING,
      AUTH_PATHS.verificationStatus,
    ],
  ])('%s lands on its first unfinished step', async (_case, user, respond, expected) => {
    mockVerification(respond ?? NO_PROFILE);
    const { router } = await verifyAs(user);
    await waitFor(() => expect(path(router)).toBe(expected));
  });
});

describe('landing after Select a country', () => {
  it('a Buyer goes home once the country is saved', async () => {
    server.use(
      http.put(apiUrl('/auth/me/country'), () =>
        HttpResponse.json({ success: true, data: { user: { ...BUYER, preferredCountryCode: 'SG' } } }),
      ),
    );
    const { router } = openAs(BUYER, AUTH_PATHS.selectCountry);
    const u = userEvent.setup();
    await u.click(await screen.findByRole('radio', { name: 'Singapore' }));
    await u.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(path(router)).toBe('/'));
  });
});

describe('an onboarding page opened out of order', () => {
  it.each([
    [
      'Upload Document without Professional info',
      AUTH_PATHS.uploadDocuments,
      NO_PROFILE,
      AUTH_PATHS.professionalInfo,
    ],
    [
      'the status screen without Professional info',
      AUTH_PATHS.verificationStatus,
      NO_PROFILE,
      AUTH_PATHS.professionalInfo,
    ],
    [
      'the status screen with a document missing',
      AUTH_PATHS.verificationStatus,
      ONE_MISSING,
      AUTH_PATHS.uploadDocuments,
    ],
  ])('%s opens the first unfinished step', async (_case, page, respond, expected) => {
    mockVerification(respond);
    const { router } = openAs(DEVELOPER, page);
    await waitFor(() => expect(path(router)).toBe(expected));
  });

  it.each([
    ['without Professional info', NO_PROFILE, AUTH_PATHS.professionalInfo],
    ['with documents missing', DOCUMENTS_MISSING, AUTH_PATHS.uploadDocuments],
    ['Under Review', PENDING, AUTH_PATHS.verificationStatus],
  ])(
    'Select a country for a dual-role Account %s waits, then opens the developer step',
    async (_case, respond, expected) => {
      mockVerification(respond);
      const { router } = openAs(DUAL, AUTH_PATHS.selectCountry);

      expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Select a Country' })).not.toBeInTheDocument();
      await waitFor(() => expect(path(router)).toBe(expected));
    },
  );

  it.each([
    ['a Buyer changing the saved country', BUYER_WITH_COUNTRY, AUTH_PATHS.selectCountry, 'Select a Country'],
    ['an Active dual-role Account', ACTIVE_DUAL, AUTH_PATHS.selectCountry, 'Select a Country'],
    [
      'a Developer Under Review editing Professional info',
      DEVELOPER,
      AUTH_PATHS.professionalInfo,
      'Professional Information',
    ],
    [
      'an Active Developer on the status screen',
      ACTIVE_DEVELOPER,
      AUTH_PATHS.verificationStatus,
      'Your Account is Active!',
    ],
  ])('%s stays on the page (earlier or finished steps stay open)', async (_case, user, page, title) => {
    const calls = mockVerification(ACTIVE);
    const { router } = openAs(user, page);

    expect(await heading(title)).toBeInTheDocument();
    expect(path(router)).toBe(page);
    if (page !== AUTH_PATHS.verificationStatus) expect(calls.count).toBe(0);
  });

  it('a Developer Unsuccessful stays on Upload Document to resubmit', async () => {
    mockVerification(REJECTED);
    const { router } = openAs(DEVELOPER, AUTH_PATHS.uploadDocuments);

    expect(await screen.findAllByRole('group')).toHaveLength(1);
    expect(path(router)).toBe(AUTH_PATHS.uploadDocuments);
  });
});

describe('landing after a reload (session restore, TASK-049)', () => {
  it.each([
    [
      'Upload Document, Developer without Professional info',
      AUTH_PATHS.uploadDocuments,
      DEVELOPER,
      NO_PROFILE,
      AUTH_PATHS.professionalInfo,
    ],
    [
      'the status screen, a document missing',
      AUTH_PATHS.verificationStatus,
      DEVELOPER,
      ONE_MISSING,
      AUTH_PATHS.uploadDocuments,
    ],
    [
      'Select a country, dual-role Account Under Review',
      AUTH_PATHS.selectCountry,
      DUAL,
      PENDING,
      AUTH_PATHS.verificationStatus,
    ],
  ])('a reload on %s opens the first unfinished step', async (_case, page, user, respond, expected) => {
    mockVerification(respond);
    const { router } = reloadAt(page, user);
    await waitFor(() => expect(path(router)).toBe(expected));
  });

  it('a reload on the current step stays there', async () => {
    mockVerification(PENDING);
    const { router } = reloadAt(AUTH_PATHS.verificationStatus, DEVELOPER);

    expect(await heading('Your Account is Under Review')).toBeInTheDocument();
    expect(path(router)).toBe(AUTH_PATHS.verificationStatus);
  });
});

describe('Back to login on Pending', () => {
  it('still logs out and opens Log in', async () => {
    mockVerification(PENDING);
    let loggedOut = false;
    server.use(
      http.post(apiUrl('/auth/logout'), () => {
        loggedOut = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { router, store } = openAs(DEVELOPER, AUTH_PATHS.verificationStatus);
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Back to login' }));

    await waitFor(() => expect(path(router)).toBe(AUTH_PATHS.login));
    expect(loggedOut).toBe(true);
    expect(store.getState().auth.accessToken).toBeNull();
  });
});
