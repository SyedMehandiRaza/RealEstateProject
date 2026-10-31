# PROP-009: List my properties with search and paging

- **Status:** done (2026-10-31)
- **Module:** property
- **Blocked by:** PROP-004, PROP-006
- **Cites:** PROP-SPEC-001 §Endpoints #3, PROP-DEC-014, PROP-DEC-022
- **Figma:** none

## What to build

My Properties shows only the Developer's own properties as cards, newest first, 12 per page, with a "name contains" search. Each card carries the cover image, price range from active configurations, units and the overall progress when under construction.

## Acceptance criteria

- [x] `GET /api/properties` returns only the caller's properties, newest first, with `meta { page, pageSize, total }`; default pageSize 12, max 50
- [x] Search matches names containing the text, case-insensitive; `%`, `_` and `\` are matched literally
- [x] Card shape: cover image is the first image by sort order (signed URL, 1 h); price range from Active configurations only, `null` when none; `progressPercent` only for under construction
- [x] Validation: pageSize over 50, page 0 and search over 100 characters return 422 with the shared `propertyMessages.query.*` message
- [x] Permissions: no or invalid token gets 401 `UNAUTHORIZED`; a Buyer gets 403 `FORBIDDEN`; a Developer who is not Active gets 403 `DEVELOPER_NOT_ACTIVE`

## Out of scope

- Counters from other modules (show "–" in the UI)
- The page (PROP-025)

## Verification

- `GET /api/properties`: `validate(propertyListQuerySchema)` → `service.listProperties` → `repository.listOwned`: `findAndCountAll` on the owner's rows (newest first, ties by id), then 3 batched queries for the page (configurations, images in gallery order, progress), so there is no N+1. Search is `name LIKE %text%` with `%`, `_` and `\` escaped (case-insensitive through the column collation).
- Card: `presentPropertyCard` (cover = first image, signed 1 h URL; price range from Active configurations; `progressPercent` only for under construction; DECIMALs as numbers).
- Tests: `listProperties.int.test.js`, 16 tests: owner only and newest first with meta; default 12 and pageSize 50; case-insensitive contains with trimming; `%`, `_` and `\` matched literally; the full card (cover by sort order, Active price range, progress); empty list; 5 query validations with exact messages; 401, 403 and 403 `DEVELOPER_NOT_ACTIVE`.
- `npm run check`: shared 687, backend unit 480, backend integration 506 passed + 1 skipped, frontend 276; lint, format and build pass.
