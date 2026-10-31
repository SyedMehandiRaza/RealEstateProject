# Property: status

Last updated: 2026-10-31

## Now

- Phase 0 done: property and staff migrations run on `real_estate_property`; `npm run check` green; pushed.
- Phase 1 (align) done: grill with the user, three rounds; PROP-DEC-001 to PROP-DEC-023; module spec in [docs/modules/property/README.md](../../modules/property/README.md). No property table changed.
- Phase 2 (contract) done: [PROP-SPEC-001](specs/PROP-SPEC-001-property-listings-api-and-pages.md) (29 endpoints, 8 pages) approved by the user on 2026-10-31, with the country list (PROP-Q-033), the gallery "Type" select, Leaflet + OpenStreetMap for the map pin and 200 uploads per hour per account. Shared schemas, messages, enums, limits and parity cases with tests (shared suite 687 tests). No new error code.
- Phase 3 done: ticket list approved by the user on 2026-10-31; PROP-001 to PROP-042 written in `tickets/` and on the board.
- Phase 4 (build): PROP-001 to PROP-003 done; next PROP-004.
- Open: PROP-Q-022 (staff access, for the staff module).

## Next actions

- Build tickets in ID order, one at a time, test-first; per ticket: `npm run check`, Verification, board, commit, push.

## Blockers

- None. Staff access waits for the staff module (PROP-Q-022).
