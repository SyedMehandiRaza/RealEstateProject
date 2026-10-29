import { commonMessages, ERROR_CODES } from '@real-estate/shared';
import { applyServerErrors } from '../applyServerErrors.js';

const apiError = (error) => ({
  status: error.code === 'VALIDATION_ERROR' ? 422 : 500,
  data: { success: false, error },
});

describe('applyServerErrors', () => {
  it('sets each field error with the exact server (shared) message', () => {
    const setError = jest.fn();
    const formMessage = applyServerErrors(
      apiError({
        code: 'VALIDATION_ERROR',
        message: ERROR_CODES.VALIDATION_ERROR.message,
        fields: { id: [commonMessages.id.invalid], 'address.city': ['City is required'] },
      }),
      setError,
    );

    expect(setError).toHaveBeenCalledWith(
      'id',
      { type: 'server', message: commonMessages.id.invalid },
      { shouldFocus: true },
    );
    expect(setError).toHaveBeenCalledWith(
      'address.city',
      { type: 'server', message: 'City is required' },
      { shouldFocus: false },
    );
    expect(formMessage).toBeNull();
  });

  it('returns the form-level message for non-field errors', () => {
    const setError = jest.fn();
    const message = applyServerErrors(
      apiError({ code: 'CONFLICT', message: ERROR_CODES.CONFLICT.message }),
      setError,
    );
    expect(setError).not.toHaveBeenCalled();
    expect(message).toBe(ERROR_CODES.CONFLICT.message);
  });

  it('returns a _form message when present', () => {
    const message = applyServerErrors(
      apiError({ code: 'VALIDATION_ERROR', message: 'x', fields: { _form: [commonMessages.unknownField] } }),
      jest.fn(),
    );
    expect(message).toBe(commonMessages.unknownField);
  });

  it('falls back to a generic message for network errors', () => {
    expect(applyServerErrors({ status: 'FETCH_ERROR' }, jest.fn())).toBe(
      'Something went wrong, please try again',
    );
  });
});
