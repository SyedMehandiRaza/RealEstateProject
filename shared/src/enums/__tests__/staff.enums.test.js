import { LIMITS } from '../../limits.js';
import { USER_ROLES } from '../auth.enums.js';
import { STAFF_PERMISSIONS, STAFF_ROLES, STAFF_STATUSES } from '../staff.enums.js';

// Pinned lists: a change needs a migration of the matching MySQL ENUM (STAFF-DEC-002).
describe('staff enums', () => {
  it('has only the designed "Agent" role', () => {
    expect(STAFF_ROLES).toEqual(['agent']);
  });

  it('has the Active / Disable statuses', () => {
    expect(STAFF_STATUSES).toEqual(['active', 'disabled']);
  });

  it('has the five access areas of the staff detail, in display order', () => {
    expect(STAFF_PERMISSIONS).toEqual([
      'properties_management',
      'leads_crm',
      'payment_tracking',
      'marketing',
      'facility_management',
    ]);
  });

  it('keeps the staff role apart from account roles (the login role is a follow-up, STAFF-DEC-001)', () => {
    expect(STAFF_ROLES.some((role) => USER_ROLES.includes(role))).toBe(false);
  });
});

describe('staff limits', () => {
  it('equal the auth account limits, so a staff member can become a user', () => {
    expect(LIMITS.staff.fullName).toEqual(LIMITS.auth.fullName);
    expect(LIMITS.staff.email).toEqual(LIMITS.auth.email);
    expect(LIMITS.staff.phone).toEqual(LIMITS.auth.phone);
  });
});
