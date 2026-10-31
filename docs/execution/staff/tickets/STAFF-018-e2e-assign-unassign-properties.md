# STAFF-018: E2E journeys: assign and unassign properties

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-015, STAFF-016
- **Cites:** STAFF-SPEC-001 §Testing Decisions; STAFF-DEC-009, STAFF-DEC-015
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

Playwright journeys assign a seeded property to a member from the picker, see its card, unassign it and see it back in the picker; a developer never sees another developer's properties, and the empty picker messages appear.

## Acceptance criteria

- [x] Assign → card appears first with name, city and state and status badge; survives a reload
- [x] Unassign → card gone; the property is back in the picker
- [x] Another developer's seeded property never appears in the picker
- [x] Picker empty states: all assigned → `allPropertiesAssigned`; no properties → `noProperties`
- [x] A disabled member can be assigned
- [x] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Cover images (STAFF-022)

## Verification

- `e2e/tests/staff/staff-assign.spec.js`: 5 tests, all passing against the real API (18.9 s): assign from the picker → card first with location, Under construction badge and View Property link → survives reload → Unassign removes it → the picker offers it again; another developer's property is never offered; `ui.noProperties` when the developer has none; `ui.allPropertiesAssigned` when the member has them all; a disabled member can be assigned.
- No production code changed. Lint and format green.
