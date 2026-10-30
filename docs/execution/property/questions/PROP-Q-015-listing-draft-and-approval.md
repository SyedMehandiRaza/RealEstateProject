# PROP-Q-015: Is a property saved as a draft between wizard steps, or reviewed by an Admin before it is listed?

- **Status:** open
- **Blocks:** approval of the property migration (`20261030212741-create-property-tables.cjs`)
- **Asked by:** db-architect session (DB design for property and staff), 2026-10-31

## Context

Add Property is a 6-step wizard ending in Review & Submit ([13009:11344](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11344)) and "Property Added Successfully" ([13009:11599](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11599)). No draft, publish or approval state appears anywhere.

## Options

1. (recommended) No drafts and no approval: the wizard keeps its data in the browser and Submit creates everything in one request; the property is listed at once. No listing-status column.
2. Save a draft after each step: needs `listing_status ENUM('draft', 'published')` and relaxed NOT NULLs.
3. Admin approval before listing: needs `listing_status ENUM('pending', 'approved', 'rejected')` and reviewer columns.

## Answer

Not answered yet. Assumption in force (reversible, marked ASSUMED in [docs/modules/property/db.md](../../../modules/property/db.md)): option 1.
