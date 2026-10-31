import { LIMITS } from '../limits.js';

const L = LIMITS.staff;

// User-facing staff messages (STAFF-SPEC-001). Field messages are used by the Zod schemas; `api` messages
// are returned by the backend; `ui` texts are shown by the pages where Figma has no copy; `labels` are the
// display names of the shared enum values.
export const staffMessages = {
  fullName: {
    required: 'Full name is required',
    min: `Full name must be at least ${L.fullName.min} characters`,
    max: `Full name must be at most ${L.fullName.max} characters`,
  },
  email: {
    required: 'Email is required',
    max: `Email must be at most ${L.email.max} characters`,
    invalid: 'Enter a valid email address',
    // 409 CONFLICT: the employer already has a staff member with this email (STAFF-DEC-004).
    taken: 'A staff member with this email already exists',
    // 409 CONFLICT: the employer's own account email (STAFF-DEC-017).
    self: 'You cannot add yourself as staff',
  },
  phone: {
    required: 'Phone number is required',
    max: 'Phone number is too long',
    invalid: 'Enter the phone number with its country code, for example +971 50 123 4567',
  },
  role: {
    invalid: 'Select a role',
  },
  permissions: {
    required: 'Select at least one access permission',
    invalid: 'Select access permissions from the list',
    duplicate: 'Each access permission can be selected only once',
  },
  status: {
    invalid: 'Choose Active or Disable',
  },
  propertyId: {
    invalid: 'Choose a property',
  },
  api: {
    // 404 NOT_FOUND for an unknown staff member or another developer's.
    notFound: 'Staff member not found',
    // 404 NOT_FOUND when assigning a property that does not exist or is not the employer's.
    propertyNotFound: 'Property not found',
    // 409 CONFLICT when the property is already assigned to this staff member.
    alreadyAssigned: 'This property is already assigned to this staff member',
    // 404 NOT_FOUND when unassigning a property that is not assigned to this staff member.
    notAssigned: 'This property is not assigned to this staff member',
  },
  ui: {
    emptyList: 'No staff added yet',
    loadFailed: 'Could not load the data. Please try again',
    noPropertiesAssigned: 'No properties assigned yet',
    allPropertiesAssigned: 'All your properties are already assigned to this staff member',
    noProperties: 'You have no properties yet',
    addedTitle: 'Successfully Added',
    addedBody: 'Your new staff has been added to the staff Management.',
    removeTitle: (fullName) => `Remove ${fullName}?`,
    removeBody: 'Their access permissions and property assignments will be deleted. This cannot be undone.',
  },
  labels: {
    roles: { agent: 'Agent' },
    statuses: { active: 'Active', disabled: 'Disable' },
    permissions: {
      properties_management: 'Properties Management',
      leads_crm: 'Leads & CRM',
      payment_tracking: 'Payment Tracking',
      marketing: 'Marketing',
      facility_management: 'Facility Management',
    },
    propertyStatuses: { ready_to_move: 'Ready to move', under_construction: 'Under construction' },
  },
};
