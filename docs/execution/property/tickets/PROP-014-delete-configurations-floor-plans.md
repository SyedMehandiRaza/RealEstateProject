# PROP-014: Delete configurations and manage floor plans

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-004, PROP-013
- **Cites:** PROP-SPEC-001 §Endpoints #10–12, PROP-SPEC-001 §Service rules, PROP-DEC-017, DEC-018
- **Figma:** none

## What to build

The Developer deletes a configuration (but never the last one) and adds or removes its floor plans, at most 10 each. Removed files are queued for deletion.

## Acceptance criteria

- [ ] `DELETE …/configurations/:configurationId` returns 204 and queues its floor plan files; deleting the last one returns 409 with `propertyMessages.api.configurationsLastOne`
- [ ] `POST …/floor-plans` with a valid file returns 201 `{ floorPlan }`; `DELETE …/floor-plans/:floorPlanId` returns 204 and queues the file
- [ ] Validation: the file rules return 422 at `file` with the shared message and nothing is uploaded
- [ ] Errors: an 11th floor plan returns 409 with `propertyMessages.api.floorPlansMax` and nothing is uploaded; if the save fails after upload the file is deleted or queued
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- The tab (PROP-030)

## Verification

_Filled when done._
