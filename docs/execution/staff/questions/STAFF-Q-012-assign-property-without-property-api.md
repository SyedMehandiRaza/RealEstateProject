# STAFF-Q-012: How does Assign Property work before the property module is merged?

- **Status:** answered (2026-10-31)
- **Blocks:** nothing
- **Asked by:** staff session, /grill-with-docs round 1, 2026-10-31

## Context

The Detail ([13009:18226](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-18226)) has an Assigned Property card and Assign Property, but no picker frame and no unassign control. `feature/staff` has the property tables and models, but no property API or pages.

## Options

1. (recommended) Staff reads the employer's properties itself (read-only): GET assignable properties, POST to assign, DELETE to unassign (an added "Unassign" link). "View Property" links to `/properties/:id` (property's route). "Leads Assigned" and the second "Active" are hidden until CRM exists. Cover = first image of `property_media` or a placeholder. Disabled staff can still be assigned.
2. Wait for property's API (ticket blocked).

## Answer

User, 2026-10-31: "yes" (option 1). Decision: [STAFF-DEC-009](../decisions/STAFF-DEC-009-staff-reads-employer-properties.md).
