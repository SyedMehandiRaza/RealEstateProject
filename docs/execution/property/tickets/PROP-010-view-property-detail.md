# PROP-010: View a property's detail

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** PROP-004, PROP-006
- **Cites:** PROP-SPEC-001 §Endpoints #4, PROP-SPEC-001 §Response and error shapes, PROP-DEC-022, PROP-DEC-010
- **Figma:** none

## What to build

Opening a property returns everything the Overview header needs: all fields, features, configuration names, price range, cover image, and progress with phase badges when under construction.

## Acceptance criteria

- [x] `GET /api/properties/:id` returns 200 with the detail shape; files carry signed URLs valid 1 hour and no public id
- [x] Progress is present with phase badges (`complete`, `in_progress`, `null`) only for under construction; `null` otherwise
- [x] Price range uses Active configurations only
- [x] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`
- [x] Permissions: another Developer's property id and a missing id both get 404 `NOT_FOUND`; a child id that belongs to another property gets 404

## Out of scope

- Tabs data (PROP-013 onwards)

## Verification

- `GET /api/properties/:id`: the `:id` guard (PROP-006) loads the caller's property; `service.getProperty` returns the PROP-008 detail shape from `repository.findDetail`.
- Tests: `propertyDetail.int.test.js`, 7 tests: the full detail (cover by sort order, configuration names in created order, Active price range, signed URLs, no public id); progress with badges only under construction, and hidden again after a change back to ready to move; 404 for another owner's property and for a missing id; 422 for an invalid id; 401, 403 and 403 `DEVELOPER_NOT_ACTIVE`.
- PROP-006's mount test now uses a path that matches no route, since `GET /:id` now answers `/nothing-here` with 422.
- `npm run check`: shared 687, backend unit 480, backend integration 513 passed + 1 skipped, frontend 276; lint, format and build pass.
