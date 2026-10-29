import { LIMITS } from '../limits.js';
import { authMessages as m } from '../messages/auth.messages.js';
import { commonMessages } from '../messages/common.messages.js';

// Invalid inputs for the auth schemas, each with the field it fails on and the shared message it must
// produce. The shared schema tests, the backend parity tests (posting each one to the API) and the
// frontend form tests replay the same table, so all three check the same rule with the same message.
//
// A case is { name, input, field, message }: `input` overrides the schema's `valid` object, a value of
// undefined means "field missing" (JSON drops it), and `field` is the key in `error.fields` (`_form`
// for an object-level issue). A field can carry more than one message; `message` must be among them.

const L = LIMITS.auth;
const longText = (length) => 'a'.repeat(length);
const emailOfLength = (length) => `${'a'.repeat(length - '@example.com'.length)}@example.com`;

const fieldCase = (field, value, message, extra = {}) => ({
  name: `${field}=${JSON.stringify(value) ?? 'missing'}`,
  input: { [field]: value, ...extra },
  field,
  message,
});

// A new password is typed twice; the cases set both, so only the password rule fails.
const passwordCase = (value, message) =>
  fieldCase('password', value, message, value === undefined ? {} : { confirmPassword: value });

export const signUpCases = {
  valid: {
    role: 'buyer',
    fullName: 'Sara Khan',
    email: 'sara@example.com',
    phone: '+971 50 123 4567',
    password: 'secret123',
    confirmPassword: 'secret123',
  },
  invalid: [
    fieldCase('role', 'admin', m.role.invalid),
    fieldCase('role', 'agent', m.role.invalid),
    fieldCase('role', undefined, m.role.invalid),
    fieldCase('fullName', undefined, m.fullName.required),
    fieldCase('fullName', '', m.fullName.required),
    fieldCase('fullName', '   ', m.fullName.required),
    fieldCase('fullName', 'A', m.fullName.min),
    fieldCase('fullName', longText(L.fullName.max + 1), m.fullName.max),
    fieldCase('email', undefined, m.email.required),
    fieldCase('email', '  ', m.email.required),
    fieldCase('email', 'not-an-email', m.email.invalid),
    fieldCase('email', emailOfLength(L.email.max + 1), m.email.max),
    fieldCase('phone', undefined, m.phone.required),
    fieldCase('phone', ' ', m.phone.required),
    fieldCase('phone', '0501234567', m.phone.invalid),
    fieldCase('phone', '+12345', m.phone.invalid),
    fieldCase('phone', `+${'1'.repeat(16)}`, m.phone.max),
    passwordCase(undefined, m.password.required),
    passwordCase('', m.password.required),
    passwordCase('abc1234', m.password.min),
    passwordCase(`${'a'.repeat(L.password.max)}1`, m.password.max),
    passwordCase(`${'é'.repeat(36)}1`, m.password.max),
    passwordCase('12345678', m.password.letter),
    passwordCase('abcdefgh', m.password.digit),
    fieldCase('confirmPassword', undefined, m.confirmPassword.required),
    fieldCase('confirmPassword', '', m.confirmPassword.required),
    { ...fieldCase('confirmPassword', 'secret124', m.confirmPassword.mismatch), name: 'passwords differ' },
    {
      name: 'unknown field',
      input: { isAdmin: true },
      field: '_form',
      message: commonMessages.unknownField,
    },
  ],
};

export const verifyCodeCases = {
  valid: { email: 'sara@example.com', code: '012345' },
  invalid: [
    fieldCase('code', undefined, m.code.required),
    fieldCase('code', '', m.code.required),
    fieldCase('code', '12345', m.code.invalid),
    fieldCase('code', '1234567', m.code.invalid),
    fieldCase('code', '12a456', m.code.invalid),
    fieldCase('email', undefined, m.email.required),
    fieldCase('email', 'sara', m.email.invalid),
    {
      name: 'unknown field',
      input: { purpose: 'password_reset' },
      field: '_form',
      message: commonMessages.unknownField,
    },
  ],
};

export const resendCodeCases = {
  valid: { email: 'sara@example.com' },
  invalid: [
    fieldCase('email', undefined, m.email.required),
    fieldCase('email', '  ', m.email.required),
    fieldCase('email', 'sara', m.email.invalid),
    fieldCase('email', emailOfLength(L.email.max + 1), m.email.max),
    {
      name: 'unknown field',
      input: { phone: '+971501234567' },
      field: '_form',
      message: commonMessages.unknownField,
    },
  ],
};

// Log in checks only that a password was typed: the password policy applies to new passwords only.
export const loginCases = {
  valid: { email: 'sara@example.com', password: 'secret123' },
  invalid: [
    fieldCase('email', undefined, m.email.required),
    fieldCase('email', '  ', m.email.required),
    fieldCase('email', '+971501234567', m.email.invalid),
    fieldCase('email', emailOfLength(L.email.max + 1), m.email.max),
    fieldCase('password', undefined, m.password.required),
    fieldCase('password', '', m.password.required),
    fieldCase('password', longText(L.password.max + 1), m.password.max),
    {
      name: 'login by phone (email only, DEC-022)',
      input: { phone: '+971501234567' },
      field: '_form',
      message: commonMessages.unknownField,
    },
  ],
};
