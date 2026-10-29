import { http, HttpResponse } from 'msw';
import { server, apiUrl } from '../../../test/server.js';
import { makeStore } from '../../../app/store.js';
import { baseApi } from '../baseApi.js';

const testApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    me: build.query({ query: () => '/me' }),
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
    expect(store.getState().auth).toEqual({ accessToken: null, user: null });
  });

  // SPEC-001: these routes are public, so a 401 there is an answer (for example invalidCredentials
  // or an expired reset token), not an expired access token.
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
    server.use(http.post(apiUrl(path), unauthorized));
    const refreshCalls = mockRefresh();
    const store = makeStore(preloadedState);

    const result = await store.dispatch(testApi.endpoints.publicAuthCall.initiate(path));

    expect(result.error.status).toBe(401);
    expect(refreshCalls).toHaveLength(0);
    expect(store.getState().auth.accessToken).toBe('old-token');
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
    const otherApi = baseApi.injectEndpoints({
      endpoints: (build) => ({ other: build.query({ query: () => '/other' }) }),
    });

    const [me, other] = await Promise.all([
      store.dispatch(testApi.endpoints.me.initiate()),
      store.dispatch(otherApi.endpoints.other.initiate()),
    ]);

    expect(me.data.data).toEqual({ id: 1 });
    expect(other.data.success).toBe(true);
    expect(refreshCalls).toHaveLength(1);
  });
});
