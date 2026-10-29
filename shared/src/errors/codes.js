import { authMessages } from '../messages/auth.messages.js';
import { commonMessages } from '../messages/common.messages.js';

// Every API error code, its HTTP status and default user-facing message.
export const ERROR_CODES = {
  BAD_REQUEST: { status: 400, message: 'The request could not be read' },
  VALIDATION_ERROR: { status: 422, message: commonMessages.invalidInput },
  UNAUTHORIZED: { status: 401, message: 'Please log in to continue' },
  TOKEN_EXPIRED: { status: 401, message: 'Your session has expired, please log in again' },
  FORBIDDEN: { status: 403, message: 'You do not have permission to do this' },
  // Log in with the right password before the email is verified; a new code is sent within the resend rules.
  EMAIL_NOT_VERIFIED: { status: 403, message: authMessages.api.emailNotVerified },
  NOT_FOUND: { status: 404, message: 'The requested resource was not found' },
  CONFLICT: { status: 409, message: 'This record already exists' },
  TOO_MANY_REQUESTS: { status: 429, message: 'Too many requests, please try again later' },
  INTERNAL_ERROR: { status: 500, message: 'Something went wrong, please try again' },
};
