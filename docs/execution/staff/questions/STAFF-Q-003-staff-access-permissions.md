# STAFF-Q-003: Is "Assign Access Permissions" a multi-select of the five areas, with full access per area?

- **Status:** open
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Add Staff shows one "Assign Access Permissions" select ([13009:18190](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18190)). The detail lists five areas with a tick or a cross: Properties Management, Leads & CRM, Payment Tracking, Marketing, Facility Management ([13009:18226](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18226)).

## Options

1. (recommended) Multi-select of exactly those five areas; a granted area gives full access to it, limited to the properties assigned to the staff member. One row per granted area (`staff_member_permissions`).
2. Levels per area (view / edit): add `access_level ENUM('view', 'edit')`.
3. A different list of areas: please give it.

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/staff/db.md](../../../modules/staff/db.md)): option 1.
