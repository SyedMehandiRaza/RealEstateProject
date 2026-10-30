# STAFF-Q-006: How are properties assigned to staff?

- **Status:** open
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

The staff detail has an "Assigned Property" card and an "Assign Property" button ([13009:18226](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18226)). The card shows the property status badge, a second "Active" status and "8 Leads Assigned". It is not designed whether one staff member can have several properties, or one property several staff.

## Options

1. (recommended) Many-to-many: a staff member can have several properties and a property several staff (`staff_property_assignments`, unique pair). Only the employer's own properties can be assigned (checked in the service, since a single FK cannot express it). Deleting a property removes its assignments (CASCADE). The second "Active" is the property's state, and "Leads Assigned" comes from the CRM module; neither is stored here.
2. One property per staff member: `staff_members.property_id` instead of a join table.

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/staff/db.md](../../../modules/staff/db.md)): option 1.
