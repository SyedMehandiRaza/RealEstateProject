# Property: status

Last updated: 2026-10-31

## Now

- Phase 0 done: property and staff migrations run on `real_estate_property`; `npm run check` green; pushed.
- Phase 1 (align) done: grill with the user, three rounds; PROP-DEC-001 to PROP-DEC-023; module spec in [docs/modules/property/README.md](../../modules/property/README.md). No property table changed.
- Phase 2 (contract) written, **awaiting the user's approval** of the endpoints and pages: [PROP-SPEC-001](specs/PROP-SPEC-001-property-listings-api-and-pages.md) (29 endpoints, 8 pages); shared schemas, messages, enums, limits and parity cases with tests (shared suite 687 tests). No new error code.
- Open: PROP-Q-022 (staff access, for the staff module); PROP-Q-033 (country list, assumed: AE, GB, IN, SG, US).

## Next actions

- After approval: `/to-tickets`, stop for approval of the ticket list, then build ticket by ticket.

## Blockers

- None. Staff access waits for the staff module (PROP-Q-022).
