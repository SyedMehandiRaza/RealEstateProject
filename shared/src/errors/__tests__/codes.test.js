import { ERROR_CODES } from '../codes.js';
import { authMessages } from '../../messages/auth.messages.js';

describe('ERROR_CODES', () => {
  it.each(Object.entries(ERROR_CODES))('%s has an HTTP error status and a message', (_code, definition) => {
    expect(definition.status).toBeGreaterThanOrEqual(400);
    expect(definition.status).toBeLessThan(600);
    expect(definition.message).toEqual(expect.any(String));
    expect(definition.message.length).toBeGreaterThan(0);
  });

  it('answers an unverified login with 403 and the shared emailNotVerified message', () => {
    expect(ERROR_CODES.EMAIL_NOT_VERIFIED).toEqual({
      status: 403,
      message: authMessages.api.emailNotVerified,
    });
  });

  it('answers a Developer who is not Active with 403 and the shared documentsUnderReview message', () => {
    expect(ERROR_CODES.DEVELOPER_NOT_ACTIVE).toEqual({
      status: 403,
      message: authMessages.api.documentsUnderReview,
    });
  });
});
