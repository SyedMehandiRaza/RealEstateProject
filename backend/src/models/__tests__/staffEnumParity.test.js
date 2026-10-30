import { LIMITS, STAFF_PERMISSIONS, STAFF_ROLES, STAFF_STATUSES } from '@real-estate/shared';
import { readMigration } from '../../test/migrationText.js';

// The staff migration repeats the shared enums and limits as literals; these tests keep them equal.
const { text, enumValues, varcharLength } = readMigration('20261030212742-create-staff-tables.cjs');
const S = LIMITS.staff;

describe('staff migration matches shared enums', () => {
  it.each([
    ['staff_members', 'role', STAFF_ROLES],
    ['staff_members', 'status', STAFF_STATUSES],
    ['staff_member_permissions', 'permission', STAFF_PERMISSIONS],
  ])('%s.%s', (table, column, values) => {
    expect(enumValues(table, column)).toEqual(values);
  });
});

describe('staff migration matches shared limits', () => {
  it.each([
    ['staff_members', 'full_name', S.fullName.max],
    ['staff_members', 'email', S.email.max],
    ['staff_members', 'phone', S.phone.max],
  ])('%s.%s length', (table, column, max) => {
    expect(varcharLength(table, column)).toBe(max);
  });
});

describe('staff migration deletion rules', () => {
  // Matches one addForeignKey(queryInterface, table, column, name, refTable, onDelete) call.
  const onDelete = (name) => new RegExp(`'${name}',\\s*'\\w+',\\s*'([A-Z ]+)',\\s*\\);`).exec(text)?.[1];

  it('blocks deleting an account that employs staff (PROP-DEC-001)', () => {
    expect(onDelete('fk_staff_members_employer_users')).toBe('RESTRICT');
  });

  it("keeps the staff record when the member's own account is deleted (STAFF-DEC-001)", () => {
    expect(onDelete('fk_staff_members_users')).toBe('SET NULL');
  });

  it('removes permissions and assignments with the staff member or the property (STAFF-DEC-003, 005)', () => {
    expect(onDelete('fk_staff_member_permissions_staff_members')).toBe('CASCADE');
    expect(onDelete('fk_staff_property_assignments_staff_members')).toBe('CASCADE');
    expect(onDelete('fk_staff_property_assignments_properties')).toBe('CASCADE');
  });
});
