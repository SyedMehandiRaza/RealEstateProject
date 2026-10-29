import { expect } from '@playwright/test';

// Helpers for validation-parity specs (TASK-043..045). Messages always come from @real-estate/shared.

// The shared invalid cases (`@real-estate/shared/testing`) a form can express: only its own fields, typed
// as text (a missing value is a field left empty). Cases about other keys (role, unknown fields) or
// non-string values can only be sent to the API, and the backend parity tests cover them.
export function formCases(cases, fields) {
  return cases.invalid
    .filter(
      ({ input, field }) => fields.includes(field) && Object.keys(input).every((key) => fields.includes(key)),
    )
    .filter(({ input }) =>
      Object.values(input).every((value) => value === undefined || typeof value === 'string'),
    )
    .map((testCase) => ({
      ...testCase,
      input: Object.fromEntries(Object.entries(testCase.input).map(([key, value]) => [key, value ?? ''])),
    }));
}

// Records requests the page sends to `path`; call the returned function to assert there were none
// (client-side rules must answer before any request).
export function forbidRequests(page, path) {
  const sent = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === path) sent.push(request.method());
  });
  return () => expect(sent, `requests to ${path}`).toEqual([]);
}

// Sends requests to `path` with `body` instead of what the page built, so the API (not the client)
// judges it. `body` is an object, or a function of the page's body. Returns an array that collects the
// API's JSON answers.
export async function sendPastClient(page, path, body) {
  const answers = [];
  await page.route(`**${path}`, async (route) => {
    const sent = typeof body === 'function' ? body(route.request().postDataJSON()) : body;
    const response = await route.fetch({ postData: JSON.stringify(sent) });
    answers.push(await response.json());
    return route.fulfill({ response });
  });
  return answers;
}
