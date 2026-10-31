import {
  assignPropertySchema,
  staffListQuerySchema,
  staffMemberSchema,
  staffPropertyParamsSchema,
  staffStatusSchema,
} from '../staff.schema.js';
import { STAFF_PERMISSIONS, STAFF_ROLES, STAFF_STATUSES } from '../../enums/staff.enums.js';
import { commonMessages } from '../../messages/common.messages.js';
import { staffMessages as m } from '../../messages/staff.messages.js';
import { toFieldErrors } from '../../errors/toFieldErrors.js';
import { LIMITS } from '../../limits.js';
import {
  assignPropertyCases,
  staffListQueryCases,
  staffMemberCases,
  staffStatusCases,
} from '../../testing/index.js';

const L = LIMITS.staff;
const errorsOf = (schema, input) => {
  const result = schema.safeParse(input);
  if (result.success) throw new Error(`expected a validation error for ${JSON.stringify(input)}`);
  return toFieldErrors(result.error);
};
const longText = (length) => 'a'.repeat(length);
const emailOfLength = (length) => `${'a'.repeat(length - '@example.com'.length)}@example.com`;

describe('staffMemberSchema (Add Staff, Edit Staff)', () => {
  const valid = staffMemberCases.valid;

  it('accepts a staff member, trimming the name, lowercasing the email and removing phone spaces', () => {
    expect(
      staffMemberSchema.parse({ ...valid, fullName: '  Rajesh Mehta ', email: ' Rajesh@Example.COM ' }),
    ).toEqual({ ...valid, email: 'rajesh@example.com', phone: '+917485961245' });
  });

  it.each(staffMemberCases.invalid)('rejects $name with its message', ({ input, field, message }) => {
    expect(errorsOf(staffMemberSchema, { ...valid, ...input })[field]).toContain(message);
  });

  it('shows only the "required" message for an empty field', () => {
    expect(errorsOf(staffMemberSchema, { ...valid, fullName: '' }).fullName).toEqual([m.fullName.required]);
    expect(errorsOf(staffMemberSchema, { ...valid, permissions: [] }).permissions).toEqual([
      m.permissions.required,
    ]);
  });

  it('reports permission errors on the "permissions" field itself, not on an item path', () => {
    const fields = errorsOf(staffMemberSchema, { ...valid, permissions: ['admin'] });
    expect(Object.keys(fields)).toEqual(['permissions']);
  });

  it('accepts the boundary lengths', () => {
    const input = {
      ...valid,
      fullName: longText(L.fullName.max),
      email: emailOfLength(L.email.max),
      phone: `+${'1'.repeat(15)}`,
    };
    expect(staffMemberSchema.safeParse(input).success).toBe(true);
    expect(staffMemberSchema.safeParse({ ...valid, fullName: 'Al' }).success).toBe(true);
  });

  it('accepts every role and every permission, all five at once', () => {
    for (const role of STAFF_ROLES)
      expect(staffMemberSchema.safeParse({ ...valid, role }).success).toBe(true);
    expect(staffMemberSchema.parse({ ...valid, permissions: [...STAFF_PERMISSIONS] }).permissions).toEqual(
      STAFF_PERMISSIONS,
    );
  });

  it('has a label for every role and permission', () => {
    expect(Object.keys(m.labels.roles)).toEqual(STAFF_ROLES);
    expect(Object.keys(m.labels.permissions)).toEqual(STAFF_PERMISSIONS);
  });
});

describe('staffStatusSchema (Detail status dropdown)', () => {
  it.each(STAFF_STATUSES)('accepts %s', (status) => {
    expect(staffStatusSchema.parse({ status })).toEqual({ status });
  });

  it.each(staffStatusCases.invalid)('rejects $name with its message', ({ input, field, message }) => {
    expect(errorsOf(staffStatusSchema, { ...staffStatusCases.valid, ...input })[field]).toContain(message);
  });

  it('has a label for every status, "Disable" as in Figma', () => {
    expect(Object.keys(m.labels.statuses)).toEqual(STAFF_STATUSES);
    expect(m.labels.statuses.disabled).toBe('Disable');
  });
});

describe('assignPropertySchema (Assign Property)', () => {
  it('accepts a positive integer property id', () => {
    expect(assignPropertySchema.parse(assignPropertyCases.valid)).toEqual({ propertyId: 7 });
  });

  it.each(assignPropertyCases.invalid)('rejects $name with its message', ({ input, field, message }) => {
    expect(errorsOf(assignPropertySchema, { ...assignPropertyCases.valid, ...input })[field]).toContain(
      message,
    );
  });
});

describe('staffListQuerySchema (Staff List)', () => {
  it('defaults to page 1 and the staff page size of 10', () => {
    expect(staffListQuerySchema.parse({})).toEqual({ page: 1, pageSize: L.listPageSize });
    expect(L.listPageSize).toBe(10);
  });

  it('coerces the query strings', () => {
    expect(staffListQuerySchema.parse(staffListQueryCases.valid)).toEqual({ page: 2, pageSize: 10 });
    expect(staffListQuerySchema.parse({ pageSize: String(LIMITS.pagination.maxPageSize) }).pageSize).toBe(
      LIMITS.pagination.maxPageSize,
    );
  });

  it.each(staffListQueryCases.invalid)('rejects $name with its message', ({ input, field, message }) => {
    expect(errorsOf(staffListQuerySchema, input)[field]).toContain(message);
  });
});

describe('staffPropertyParamsSchema (unassign route)', () => {
  it('coerces both ids', () => {
    expect(staffPropertyParamsSchema.parse({ id: '3', propertyId: '9' })).toEqual({ id: 3, propertyId: 9 });
  });

  it.each([
    [{ id: '0', propertyId: '9' }, 'id', commonMessages.id.invalid],
    [{ id: 'x', propertyId: '9' }, 'id', commonMessages.id.invalid],
    [{ id: '3', propertyId: '0' }, 'propertyId', m.propertyId.invalid],
    [{ id: '3', propertyId: '1.5' }, 'propertyId', m.propertyId.invalid],
  ])('rejects %j on %s', (input, field, message) => {
    expect(errorsOf(staffPropertyParamsSchema, input)[field]).toContain(message);
  });
});

describe('staff messages', () => {
  it('builds the remove confirmation title from the name', () => {
    expect(m.ui.removeTitle('Rajesh Mehta')).toBe('Remove Rajesh Mehta?');
  });

  it('keeps the Figma success copy', () => {
    expect(m.ui.addedTitle).toBe('Successfully Added');
    expect(m.ui.addedBody).toBe('Your new staff has been added to the staff Management.');
  });

  it("has distinct 409 email messages for a duplicate and for the developer's own email", () => {
    expect(m.email.taken).toBe('A staff member with this email already exists');
    expect(m.email.self).toBe('You cannot add yourself as staff');
  });
});
