# STAFF-DEC-005: Staff and properties are many-to-many, limited to the employer's properties

- **Status:** accepted (user, 2026-10-31, recommended option, provisional: user will review)
- **Answers:** STAFF-Q-006
- **Tickets:** none yet

## Decision

- `staff_property_assignments (staff_member_id, property_id)`, unique pair: a staff member can have several properties and a property several staff. This is the only staff -> property FK.
- Only the employer's own properties can be assigned (`properties.owner_id = staff_members.employer_id`): checked in the service, since one FK cannot express it.
- Deleting a property or a staff member removes its assignments (`ON DELETE CASCADE` on both FKs).
- The card's second "Active" is the property's own state and "Leads Assigned" comes from the CRM module; neither is stored here.

## Why

The detail shows an "Assigned Property" card and an "Assign Property" button with no limit, and the permissions apply per assigned property (STAFF-DEC-002).

## Alternatives rejected

- One property per staff member (`staff_members.property_id`): limits the design without a reason.
