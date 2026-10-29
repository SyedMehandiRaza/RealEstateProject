import { http, HttpResponse } from 'msw';
import { server, apiUrl } from '../../../test/server.js';
import { makeStore } from '../../../app/store.js';
import { baseApi, REFRESH_LOCK } from '../baseApi.js';

const testApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    me: build.query({ query: () => '/me' }),
    other: build.query({ query: () => '/other' }),
    publicAuthCall: build.mutation({ query: (url) => ({ url, method: 'POST', body: {} }) }),
  }),
});

// Counts POST /auth/refresh calls; answers with a new token unless told otherwise.
function mockRefresh(
  response = () =>
    HttpResponse.json({
      success: true,
      data: { accessToken: 'new-token', user: { id: 1, roles: ['buyer'] } },
    }),
) {
  const calls = [];
  server.use(
    http.post(apiUrl('/auth/refresh'), () => {
      calls.push(1);
      return response();
    }),
  );
  return calls;
}

const unauthorized = () =>
  HttpResponse.json(
    { success: false, error: { code: 'TOKEN_EXPIRED', message: 'expired' } },
    { status: 401 },
  );

function meRequiringToken(validToken) {
  return http.get(apiUrl('/me'), ({ request }) =>
    request.headers.get('authorization') === `Bearer ${validToken}`
      ? HttpResponse.json({ success: true, data: { id: 1 } })
      : unauthorized(),
  );
}

const preloadedState = { auth: { accessToken: 'old-token', user: { id: 1, roles: ['buyer'] } } };

describe('baseQueryWithReauth', () => {
  it('sends the access token as a Bearer header', async () => {
    server.use(meRequiringToken('old-token'));
    const store = makeStore(preloadedState);
    const result = await store.dispatch(testApi.endpoints.me.initiate());
    expect(result.data).toEqual({ success: true, data: { id: 1 } });
  });

  it('refreshes once on 401, stores the new token and retries', async () => {
    let refreshCalls = 0;
    server.use(
      meRequiringToken('new-token'),
      http.post(apiUrl('/auth/refresh'), () => {
        refreshCalls += 1;
        return HttpResponse.json({
          success: true,
          data: { accessToken: 'new-token', user: { id: 1, roles: ['buyer'] } },
        });
      }),
    );
    const store = makeStore(preloadedState);

    const result = await store.dispatch(testApi.endpoints.me.initiate());

    expect(result.data.data).toEqual({ id: 1 });
    expect(refreshCalls).toBe(1);
    expect(store.getState().auth.accessToken).toBe('new-token');
  });

  it('logs out when the refresh fails', async () => {
    server.use(meRequiringToken('never'), http.post(apiUrl('/auth/refresh'), unauthorized));
    const store = makeStore(preloadedState);

    const result = await store.dispatch(testApi.endpoints.me.initiate());

    expect(result.error.status).toBe(401);
    expect(store.getState().auth).toMatchObject({ accessToken: null, user: null });
  });

  // SPEC-001: these routes are public and are called while logged out, so the request carries no
  // access token and its 401 is an answer (for example invalidCredentials or an expired reset
  // token), not an expired access token (TASK-049: decided by the request, not by a path list).
  it.each([
    '/auth/login',
    '/auth/sign-up',
    '/auth/verify-email',
    '/auth/verify-email/resend',
    '/auth/password/forgot',
    '/auth/password/verify',
    '/auth/password/resend',
    '/auth/password/reset',
  ])('does not refresh after a 401 from the public %s', async (path) => {
    const sentAuthorization = [];
    server.use(
      http.post(apiUrl(path), ({ request }) => {
        sentAuthorization.push(request.headers.get('authorization'));
        return unauthorized();
      }),
    );
    const refreshCalls = mockRefresh();
    const store = makeStore();

    const result = await store.dispatch(testApi.endpoints.publicAuthCall.initiate(path));

    expect(result.error.status).toBe(401);
    expect(sentAuthorization).toEqual([null]);
    expect(refreshCalls).toHaveLength(0);
  });

  it('does not refresh after a 401 from any request sent without an access token', async () => {
    server.use(meRequiringToken('new-token'));
    const refreshCalls = mockRefresh();
    const store = makeStore();

    const result = await store.dispatch(testApi.endpoints.me.initiate());

    expect(result.error.status).toBe(401);
    expect(refreshCalls).toHaveLength(0);
    expect(store.getState().auth.accessToken).toBeNull();
  });

  it('never refreshes again after a 401 from the refresh call itself', async () => {
    const refreshCalls = mockRefresh(unauthorized);
    const store = makeStore(preloadedState);

    const result = await store.dispatch(testApi.endpoints.publicAuthCall.initiate('/auth/refresh'));

    expect(result.error.status).toBe(401);
    expect(refreshCalls).toHaveLength(1);
  });

  it('still refreshes and retries after a 401 from an authenticated endpoint', async () => {
    server.use(meRequiringToken('new-token'));
    const refreshCalls = mockRefresh();
    const store = makeStore(preloadedState);

    const result = await store.dispatch(testApi.endpoints.me.initiate());

    expect(result.data.data).toEqual({ id: 1 });
    expect(refreshCalls).toHaveLength(1);
  });

  it('shares one refresh between parallel 401s', async () => {
    server.use(
      meRequiringToken('new-token'),
      http.get(apiUrl('/other'), ({ request }) =>
        request.headers.get('authorization') === 'Bearer new-token'
          ? HttpResponse.json({ success: true, data: {} })
          : unauthorized(),
      ),
    );
    const refreshCalls = mockRefresh();
    const store = makeStore(preloadedState);

    const [me, other] = await Promise.all([
      store.dispatch(testApi.endpoints.me.initiate()),
      store.dispatch(testApi.endpoints.other.initiate()),
    ]);

    expect(me.data.data).toEqual({ id: 1 });
    expect(other.data.success).toBe(true);
    expect(refreshCalls).toHaveLength(1);
  });

  it('falls back to the in-tab refresh when navigator.locks does not exist (jsdom)', async () => {
    expect(navigator.locks).toBeUndefined();
    server.use(meRequiringToken('new-token'));
    const refreshCalls = mockRefresh();
    const store = makeStore(preloadedState);

    const result = await store.dispatch(testApi.endpoints.me.initiate());

    expect(result.data.data).toEqual({ id: 1 });
    expect(refreshCalls).toHaveLength(1);
  });
});

// A second "tab": fresh copies of the store and baseApi modules, so the in-tab refresh is not shared.
function loadTab() {
  let tab;
  jest.isolateModules(() => {
    const { makeStore: makeTabStore } = require('../../../app/store.js');
    const { baseApi: tabApi } = require('../baseApi.js');
    const api = tabApi.injectEndpoints({
      endpoints: (build) => ({ me: build.query({ query: () => '/me' }) }),
    });
    tab = { store: makeTabStore(preloadedState), me: api.endpoints.me };
  });
  return tab;
}

// A fake Web Locks API: exclusive locks per name, granted in request order, shared by every "tab"
// (here: every store) like the browser's per-origin lock manager.
function installFakeLocks() {
  const queues = new Map();
  const requests = [];
  const locks = {
    request: jest.fn((name, callback) => {
      requests.push(name);
      const previous = queues.get(name) ?? Promise.resolve();
      const run = previous.then(() => callback({ name, mode: 'exclusive' }));
      queues.set(
        name,
        run.catch(() => {}),
      );
      return run;
    }),
  };
  Object.defineProperty(navigator, 'locks', { value: locks, configurable: true });

  // Holds the lock from outside, as another tab would; returns a function that releases it.
  function holdFromAnotherTab(name = REFRESH_LOCK) {
    let release;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    let granted;
    const grantedPromise = new Promise((resolve) => {
      granted = resolve;
    });
    locks.request(name, () => {
      granted();
      return held;
    });
    return grantedPromise.then(() => release);
  }

  return { locks, requests, holdFromAnotherTab };
}

describe('baseQueryWithReauth across tabs (navigator.locks, TASK-046)', () => {
  let fake;

  beforeEach(() => {
    fake = installFakeLocks();
  });

  afterEach(() => {
    delete navigator.locks;
  });

  it(`refreshes inside the "${REFRESH_LOCK}" lock`, async () => {
    server.use(meRequiringToken('new-token'));
    let lockHeldDuringRefresh = false;
    let inLock = false;
    fake.locks.request.mockImplementation(async (name, callback) => {
      fake.requests.push(name);
      inLock = true;
      try {
        return await callback({ name, mode: 'exclusive' });
      } finally {
        inLock = false;
      }
    });
    mockRefresh(() => {
      lockHeldDuringRefresh = inLock;
      return HttpResponse.json({
        success: true,
        data: { accessToken: 'new-token', user: { id: 1, roles: ['buyer'] } },
      });
    });
    const store = makeStore(preloadedState);

    const result = await store.dispatch(testApi.endpoints.me.initiate());

    expect(result.data.data).toEqual({ id: 1 });
    expect(fake.requests).toEqual([REFRESH_LOCK]);
    expect(lockHeldDuringRefresh).toBe(true);
    expect(store.getState().auth.accessToken).toBe('new-token');
  });

  it('still takes one lock and sends one refresh for parallel 401s in one tab', async () => {
    server.use(
      meRequiringToken('new-token'),
      http.get(apiUrl('/other'), ({ request }) =>
        request.headers.get('authorization') === 'Bearer new-token'
          ? HttpResponse.json({ success: true, data: {} })
          : unauthorized(),
      ),
    );
    const refreshCalls = mockRefresh();
    const store = makeStore(preloadedState);

    const [me, other] = await Promise.all([
      store.dispatch(testApi.endpoints.me.initiate()),
      store.dispatch(testApi.endpoints.other.initiate()),
    ]);

    expect(me.data.data).toEqual({ id: 1 });
    expect(other.data.success).toBe(true);
    expect(fake.requests).toEqual([REFRESH_LOCK]);
    expect(refreshCalls).toHaveLength(1);
  });

  it('waits while another tab holds the lock, then refreshes once it is released', async () => {
    server.use(meRequiringToken('new-token'));
    const refreshCalls = mockRefresh();
    const release = await fake.holdFromAnotherTab();
    const store = makeStore(preloadedState);

    const pending = store.dispatch(testApi.endpoints.me.initiate());
    // Let the first /me (401) answer and the lock request queue up behind the other tab.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fake.requests).toEqual([REFRESH_LOCK, REFRESH_LOCK]);
    expect(refreshCalls).toHaveLength(0);

    release();
    const result = await pending;

    expect(refreshCalls).toHaveLength(1);
    expect(result.data.data).toEqual({ id: 1 });
    expect(store.getState().auth.accessToken).toBe('new-token');
  });

  it('serializes two tabs: the second refresh starts only after the first one answered', async () => {
    server.use(
      http.get(apiUrl('/me'), ({ request }) =>
        /^Bearer token-\d$/.test(request.headers.get('authorization') ?? '')
          ? HttpResponse.json({ success: true, data: { id: 1 } })
          : unauthorized(),
      ),
    );
    // Server-side rotation: each refresh hands out the next token. Overlapping refreshes would be
    // the reuse the API punishes by revoking every session.
    let rotation = 0;
    let inFlight = 0;
    let overlapped = false;
    server.use(
      http.post(apiUrl('/auth/refresh'), async () => {
        inFlight += 1;
        if (inFlight > 1) overlapped = true;
        await new Promise((resolve) => setTimeout(resolve, 20));
        rotation += 1;
        inFlight -= 1;
        return HttpResponse.json({
          success: true,
          data: { accessToken: `token-${rotation}`, user: { id: 1, roles: ['buyer'] } },
        });
      }),
    );
    // Each tab has its own copy of the module (its own in-tab refresh), like two browser tabs.
    const tabA = loadTab();
    const tabB = loadTab();

    const [a, b] = await Promise.all([
      tabA.store.dispatch(tabA.me.initiate()),
      tabB.store.dispatch(tabB.me.initiate()),
    ]);

    expect(overlapped).toBe(false);
    expect(rotation).toBe(2);
    expect(fake.requests).toEqual([REFRESH_LOCK, REFRESH_LOCK]);
    // The tab that waited refreshed again (with the rotated cookie in a browser) and got its own token.
    expect([tabA.store.getState().auth.accessToken, tabB.store.getState().auth.accessToken].sort()).toEqual([
      'token-1',
      'token-2',
    ]);
    expect(a.data.data).toEqual({ id: 1 });
    expect(b.data.data).toEqual({ id: 1 });
  });

  it('logs out after a failed refresh inside the lock and releases it for the next tab', async () => {
    server.use(meRequiringToken('never'), http.post(apiUrl('/auth/refresh'), unauthorized));
    const store = makeStore(preloadedState);

    const result = await store.dispatch(testApi.endpoints.me.initiate());

    expect(result.error.status).toBe(401);
    expect(store.getState().auth).toMatchObject({ accessToken: null, user: null });
    const release = await fake.holdFromAnotherTab();
    release();
  });

  it('does not take the lock after a 401 from a public auth route', async () => {
    server.use(http.post(apiUrl('/auth/login'), unauthorized));
    const refreshCalls = mockRefresh();
    const store = makeStore();

    const result = await store.dispatch(testApi.endpoints.publicAuthCall.initiate('/auth/login'));

    expect(result.error.status).toBe(401);
    expect(fake.requests).toEqual([]);
    expect(refreshCalls).toHaveLength(0);
  });
});
