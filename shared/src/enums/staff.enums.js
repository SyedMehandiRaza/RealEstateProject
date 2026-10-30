// Staff enum values, shared by Zod schemas, Sequelize models and (as literals) the migration
// 20261030212742-create-staff-tables.cjs. Changing a list here needs a migration that changes the
// matching MySQL ENUM; models/__tests__/staffEnumParity.test.js in backend/ fails if they drift apart.
// The lists are the provisional answers of 2026-10-31 (STAFF-DEC-002).

// Staff "Role" dropdown (STAFF-Q-002): only "Agent" is designed so far. Not an account role in
// user_roles: the login role for staff is a follow-up for the integration owner (STAFF-DEC-001).
export const STAFF_ROLES = ['agent'];

// List and Detail status: Active / Disable.
export const STAFF_STATUSES = ['active', 'disabled'];

// "Assign Access Permissions": the five areas, each granted in full (STAFF-Q-003).
export const STAFF_PERMISSIONS = [
  'properties_management',
  'leads_crm',
  'payment_tracking',
  'marketing',
  'facility_management',
];
