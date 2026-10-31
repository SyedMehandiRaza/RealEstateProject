# PROP-009: List my properties with search and paging

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-004, PROP-006
- **Cites:** PROP-SPEC-001 §Endpoints #3, PROP-DEC-014, PROP-DEC-022
- **Figma:** none

## What to build

My Properties shows only the Developer's own properties as cards, newest first, 12 per page, with a "name contains" search. Each card carries the cover image, price range from active configurations, units and the overall progress when under construction.

## Acceptance criteria

- [ ] `GET /api/properties` returns only the caller's properties, newest first, with `meta { page, pageSize, total }`; default pageSize 12, max 50
- [ ] Search matches names containing the text, case-insensitive; `%`, `_` and `\` are matched literally
- [ ] Card shape: cover image is the first image by sort order (signed URL, 1 h); price range from Active configurations only, `null` when none; `progressPercent` only for under construction
- [ ] Validation: pageSize over 50, page 0 and search over 100 characters return 422 with the shared `propertyMessages.query.*` message
- [ ] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`

## Out of scope

- Counters from other modules (show "–" in the UI)
- The page (PROP-025)

## Verification

_Filled when done._
