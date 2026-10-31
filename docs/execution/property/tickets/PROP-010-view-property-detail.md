# PROP-010: View a property's detail

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-004, PROP-006
- **Cites:** PROP-SPEC-001 §Endpoints #4, PROP-SPEC-001 §Response and error shapes, PROP-DEC-022, PROP-DEC-010
- **Figma:** none

## What to build

Opening a property returns everything the Overview header needs: all fields, features, configuration names, price range, cover image, and progress with phase badges when under construction.

## Acceptance criteria

- [ ] `GET /api/properties/:id` returns 200 with the detail shape; files carry signed URLs valid 1 hour and no public id
- [ ] Progress is present with phase badges (`complete`, `in_progress`, `null`) only for under construction; `null` otherwise
- [ ] Price range uses Active configurations only
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [ ] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- Tabs data (PROP-013 onwards)

## Verification

_Filled when done._
