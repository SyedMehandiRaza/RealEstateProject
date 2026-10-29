import { http, HttpResponse } from 'msw';
import { server, apiUrl } from '../../../test/server.js';
import { makeStore } from '../../../app/store.js';
import { baseApi } from '../baseApi.js';

const testApi = baseApi.injectEndpoints({
  endpoints: (build) => ({ me: build.query({ query: () => '/me' }) }),
});

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
});
