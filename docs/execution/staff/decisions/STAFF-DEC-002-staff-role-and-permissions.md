# STAFF-DEC-002: Staff role is "agent" for now; permissions are a multi-select of five areas

- **Status:** accepted (user, 2026-10-31, recommended options, provisional: user will review)
- **Answers:** STAFF-Q-002, STAFF-Q-003
- **Tickets:** none yet

## Decision

- **Role** (STAFF-Q-002): `staff_members.role ENUM('agent')` (`STAFF_ROLES` in `shared/src/enums/staff.enums.js`) until the user gives the full list. Adding values is a small migration plus the shared enum.
- **Permissions** (STAFF-Q-003): "Assign Access Permissions" is a multi-select of exactly five areas: `properties_management`, `leads_crm`, `payment_tracking`, `marketing`, `facility_management` (`STAFF_PERMISSIONS`). One `staff_member_permissions` row per granted area, unique per staff member; an area without a row is shown with the red cross. A granted area gives full access to that area, limited to the properties assigned to the staff member (STAFF-DEC-005).
- `status ENUM('active', 'disabled')`, default `active` (`STAFF_STATUSES`).

## Why

Only "Agent" and these five areas are visible in Figma. Rows per area keep each grant indexable and easy to extend with a new ENUM value.

## Alternatives rejected

- Drop Role and rely only on permissions: the list and detail show a role.
- Access levels per area (`access_level ENUM('view', 'edit')`): not designed.
