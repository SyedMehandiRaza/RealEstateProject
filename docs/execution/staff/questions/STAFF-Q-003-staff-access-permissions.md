# STAFF-Q-003: Is "Assign Access Permissions" a multi-select of the five areas, with full access per area?

- **Status:** answered (2026-10-31, recommended option; confirmed final by the user on 2026-10-31, grill round 1)
- **Blocks:** approval of the staff migration (`20261030212742-create-staff-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Add Staff shows one "Assign Access Permissions" select ([13009:18190](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18190)). The detail lists five areas with a tick or a cross: Properties Management, Leads & CRM, Payment Tracking, Marketing, Facility Management ([13009:18226](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18226)).

## Options

1. (recommended) Multi-select of exactly those five areas; a granted area gives full access to it, limited to the properties assigned to the staff member. One row per granted area (`staff_member_permissions`).
2. Levels per area (view / edit): add `access_level ENUM('view', 'edit')`.
3. A different list of areas: please give it.

## Answer

Answered 2026-10-31 by the user: "use the RECOMMENDED option in each file, provisionally". The user will go through each answer later; until then this answer is in force and reversible.

Option 1. A multi-select of exactly the five areas; a granted area gives full access to it, limited to the properties assigned to the staff member. One row per granted area in `staff_member_permissions`.

Decision: [STAFF-DEC-002](../decisions/STAFF-DEC-002-staff-role-and-permissions.md).
