# STAFF-Q-013: How is the staff list ordered and paged, and what are its empty, loading and error states?

- **Status:** answered (2026-10-31)
- **Blocks:** nothing
- **Asked by:** staff session, /grill-with-docs round 1, 2026-10-31

## Context

The Staff List ([13009:17816](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-17816)) shows three rows and no search, filter, sort or pagination controls, and no empty, loading or error state.

## Options

1. (recommended) Newest first; 10 per page, page controls only when there are more than 10; no search/filter/sort; the API accepts `page` and `pageSize` only. Empty: banner and Add Staff stay, the table shows "No staff added yet". Loading: skeleton rows. Error: message and Retry.
2. Add search and a status filter.

## Answer

User, 2026-10-31: "yes" (option 1). Decision: [STAFF-DEC-010](../decisions/STAFF-DEC-010-staff-list-paging-states.md).
