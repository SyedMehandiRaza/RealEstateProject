import { LIMITS } from '../limits.js';
import { commonMessages } from '../messages/common.messages.js';
import { staffMessages as m } from '../messages/staff.messages.js';

// Invalid inputs for the staff schemas (STAFF-SPEC-001), each with the field it fails on and the shared
// message it must produce. Replayed by the shared schema tests, the backend parity tests and the frontend
// form tests, like authValidationCases.js. A case is { name, input, field, message }: `input` overrides
// `valid`, undefined means "field missing", and `field` is the key in `error.fields` (`_form` for the object).

const L = LIMITS.staff;
const longText = (length) => 'a'.repeat(length);
const emailOfLength = (length) => `${'a'.repeat(length - '@example.com'.length)}@example.com`;

const fieldCase = (field, value, message) => ({
  name: `${field}=${JSON.stringify(value) ?? 'missing'}`,
  input: { [field]: value },
  field,
  message,
});

// Add Staff and Edit Staff (same body).
export const staffMemberCases = {
  valid: {
    fullName: 'Rajesh Mehta',
    email: 'rajesh@example.com',
    phone: '+91 74859 61245',
    role: 'agent',
    permissions: ['properties_management', 'leads_crm'],
  },
  invalid: [
    fieldCase('fullName', undefined, m.fullName.required),
    fieldCase('fullName', '', m.fullName.required),
    fieldCase('fullName', '   ', m.fullName.required),
    fieldCase('fullName', 'A', m.fullName.min),
    fieldCase('fullName', longText(L.fullName.max + 1), m.fullName.max),
    fieldCase('fullName', 42, m.fullName.required),
    fieldCase('email', undefined, m.email.required),
    fieldCase('email', '  ', m.email.required),
    fieldCase('email', 'not-an-email', m.email.invalid),
    fieldCase('email', emailOfLength(L.email.max + 1), m.email.max),
    fieldCase('phone', undefined, m.phone.required),
    fieldCase('phone', ' ', m.phone.required),
    fieldCase('phone', '0501234567', m.phone.invalid),
    fieldCase('phone', '+12345', m.phone.invalid),
    fieldCase('phone', `+${'1'.repeat(16)}`, m.phone.max),
    fieldCase('role', undefined, m.role.invalid),
    fieldCase('role', '', m.role.invalid),
    fieldCase('role', 'manager', m.role.invalid),
    fieldCase('permissions', undefined, m.permissions.required),
    fieldCase('permissions', [], m.permissions.required),
    fieldCase('permissions', 'marketing', m.permissions.required),
    fieldCase('permissions', ['marketing', 'admin'], m.permissions.invalid),
    fieldCase('permissions', ['marketing', 'marketing'], m.permissions.duplicate),
    {
      name: 'unknown key',
      input: { status: 'disabled' },
      field: '_form',
      message: commonMessages.unknownField,
    },
  ],
};

// Status dropdown on the Detail.
export const staffStatusCases = {
  valid: { status: 'disabled' },
  invalid: [
    fieldCase('status', undefined, m.status.invalid),
    fieldCase('status', 'Disable', m.status.invalid),
    fieldCase('status', 'deleted', m.status.invalid),
    { name: 'unknown key', input: { role: 'agent' }, field: '_form', message: commonMessages.unknownField },
  ],
};

// Assign Property picker.
export const assignPropertyCases = {
  valid: { propertyId: 7 },
  invalid: [
    fieldCase('propertyId', undefined, m.propertyId.invalid),
    fieldCase('propertyId', '7', m.propertyId.invalid),
    fieldCase('propertyId', 0, m.propertyId.invalid),
    fieldCase('propertyId', -1, m.propertyId.invalid),
    fieldCase('propertyId', 1.5, m.propertyId.invalid),
    {
      name: 'unknown key',
      input: { staffMemberId: 1 },
      field: '_form',
      message: commonMessages.unknownField,
    },
  ],
};

// Staff List query string (values arrive as strings).
export const staffListQueryCases = {
  valid: { page: '2', pageSize: '10' },
  invalid: [
    fieldCase('page', '0', commonMessages.page.invalid),
    fieldCase('page', 'abc', commonMessages.page.invalid),
    fieldCase('pageSize', '0', commonMessages.pageSize.invalid),
    fieldCase('pageSize', String(LIMITS.pagination.maxPageSize + 1), commonMessages.pageSize.invalid),
    { name: 'unknown key', input: { sort: 'name' }, field: '_form', message: commonMessages.unknownField },
  ],
};
