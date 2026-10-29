// The e2e start mode (TASK-042, DEC-036): the API with a capture mailer, fake file storage and the
// test-only /api/__e2e routes. It exists only under NODE_ENV=test, against a "_test" database.
// No side effects, so the entry point can check before it loads the app.

export const E2E_BASE_PATH = '/api/__e2e';

// Refuses every NODE_ENV but "test" (unset counts as test: the entry point then sets it). Production
// and development always use the real SMTP mailer and Cloudinary.
export function assertE2eAllowed(nodeEnv) {
  if (nodeEnv !== undefined && nodeEnv !== 'test') {
    throw new Error(
      `Refusing to start the e2e server with NODE_ENV=${nodeEnv}: the capture mailer, fake storage ` +
        'and /api/__e2e routes run only under NODE_ENV=test.',
    );
  }
}
