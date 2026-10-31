# STAFF-Q-015: How do View, Edit and Add open, and what is Edit?

- **Status:** answered (2026-10-31)
- **Blocks:** nothing
- **Asked by:** staff session, /grill-with-docs round 2, 2026-10-31

## Context

Add Staff ([13009:18190](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18190)) and the Detail ([13009:18226](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18226)) are modals; there is no Edit frame.

## Options

1. (recommended) Modals with their own URLs (`/staff/new`, `/staff/:id`, `/staff/:id/edit`); Edit = the Add form titled "Edit Staff"; success modal after Add only; 404 shows "Staff member not found".
2. Full pages for Detail and Edit.

## Answer

User, 2026-10-31: "yes for all" (option 1). Decision: [STAFF-DEC-011](../decisions/STAFF-DEC-011-staff-routes-modals-edit.md).
