import { act, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { makeStore } from '../../../../app/store.js';
import { routes } from '../../../../app/routes.jsx';
import { REFRESH_LOCK } from '../../../../services/api/baseApi.js';
import { apiUrl, server } from '../../../../test/server.js';
import { AUTH_PATHS } from '../../routes.jsx';
import { credentialsSet } from '../../store/authSlice.js';
import { restoreSession } from '../restoreSession.js';

const DEVELOPER = { id: 7, roles: ['developer'] };

const unauthorized = () =>
  HttpResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'no' } }, { status: 401 });

// POST /auth/refresh held until release(), so a test can look at the screen while it is pending.
function holdRefresh(response) {
  const calls = [];
  let release;
  const released = new Promise((resolve) => {
    release = resolve;
  });
  server.use(
    http.post(apiUrl('/auth/refresh'), async ({ request }) => {
      calls.push(request.headers.get('authorization'));
      await released;
      return response();
    }),
  );
  return { calls, release };
}

const refreshed =
  (accessToken = 'restored-token', user = DEVELOPER) =>
  () =>
    HttpResponse.json({ success: true, data: { accessToken, user } });

// What main.jsx does on a page load: start the restore, then render the app at the reloaded URL.
function reloadAt(path) {
  const store = makeStore();
  const restoring = restoreSession(store.dispatch);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return { store, router, restoring };
}

const heading = (name) => screen.findByRole('heading', { level: 1, name });

describe('restoreSession (reload keeps the session, TASK-049)', () => {
  it('a reload on a protected page waits for the refresh, then shows the page', async () => {
    const refresh = holdRefresh(refreshed());
    const { store, router, restoring } = reloadAt(AUTH_PATHS.plans);

    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AUTH_PATHS.plans);

    await act(async () => refresh.release());

    expect(await heading('Plans coming soon')).toBeInTheDocument();
    expect(await restoring).toBe(true);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.plans);
    expect(store.getState().auth).toEqual({
      accessToken: 'restored-token',
      user: DEVELOPER,
      restoringSession: false,
    });
    // The restore itself is sent without an access token, exactly once.
    expect(refresh.calls).toEqual([null]);
  });

  it('a failed refresh sends a protected page to Log in, with no error shown', async () => {
    const refresh = holdRefresh(unauthorized);
    const { store, router, restoring } = reloadAt(AUTH_PATHS.plans);

    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
    await act(async () => refresh.release());

    expect(await heading('Welcome Back!')).toBeInTheDocument();
    expect(await restoring).toBe(false);
    expect(router.state.location.pathname).toBe(AUTH_PATHS.login);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(store.getState().auth).toEqual({ accessToken: null, user: null, restoringSession: false });
    expect(refresh.calls).toHaveLength(1);
  });

  it('a network error during the refresh also ends logged out, without an error', async () => {
    server.use(http.post(apiUrl('/auth/refresh'), () => HttpResponse.error()));
    const { router, restoring } = reloadAt(AUTH_PATHS.plans);

    expect(await restoring).toBe(false);
    expect(await heading('Welcome Back!')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AUTH_PATHS.login);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    [AUTH_PATHS.login, 'Welcome Back!'],
    [AUTH_PATHS.signUp, 'Create Your Account'],
    ['/', null],
  ])('public page %s renders at once, without waiting for the refresh', async (path, title) => {
    const refresh = holdRefresh(unauthorized);
    const { router } = reloadAt(path);

    if (title) expect(await heading(title)).toBeInTheDocument();
    else await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
    expect(refresh.calls).toHaveLength(1);

    await act(async () => refresh.release());
    expect(router.state.location.pathname).toBe(path);
  });

  it('a login that finishes while the refresh is pending is kept', async () => {
    const refresh = holdRefresh(refreshed('stale-token', { id: 1, roles: ['buyer'] }));
    const { store, restoring } = reloadAt(AUTH_PATHS.login);

    act(() => {
      store.dispatch(credentialsSet({ accessToken: 'login-token', user: DEVELOPER }));
    });
    await act(async () => refresh.release());

    expect(await restoring).toBe(false);
    expect(store.getState().auth.accessToken).toBe('login-token');
    expect(store.getState().auth.user).toEqual(DEVELOPER);
  });
});

describe('restoreSession and the shared refresh path', () => {
  afterEach(() => {
    delete navigator.locks;
  });

  it(`runs inside the "${REFRESH_LOCK}" lock`, async () => {
    const requests = [];
    Object.defineProperty(navigator, 'locks', {
      value: {
        request: jest.fn((name, callback) => {
          requests.push(name);
          return Promise.resolve().then(() => callback({ name, mode: 'exclusive' }));
        }),
      },
      configurable: true,
    });
    server.use(http.post(apiUrl('/auth/refresh'), refreshed()));
    const store = makeStore();

    expect(await restoreSession(store.dispatch)).toBe(true);
    expect(requests).toEqual([REFRESH_LOCK]);
    expect(store.getState().auth.accessToken).toBe('restored-token');
  });

  it('shares the one in-tab refresh with any other caller in flight', async () => {
    let refreshCalls = 0;
    let release;
    const released = new Promise((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(apiUrl('/auth/refresh'), async () => {
        refreshCalls += 1;
        await released;
        return refreshed()();
      }),
    );
    const store = makeStore();
    const first = restoreSession(store.dispatch);
    const second = restoreSession(store.dispatch);
    release();

    // The second caller reuses the pending refresh; it finds the session already restored.
    expect([await first, await second]).toEqual([true, false]);
    expect(refreshCalls).toBe(1);
    expect(store.getState().auth.accessToken).toBe('restored-token');
    expect(store.getState().auth.restoringSession).toBe(false);
  });
});
