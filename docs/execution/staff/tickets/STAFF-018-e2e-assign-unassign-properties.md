# STAFF-018: E2E journeys: assign and unassign properties

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-015, STAFF-016
- **Cites:** STAFF-SPEC-001 §Testing Decisions; STAFF-DEC-009, STAFF-DEC-015
- **Figma:** Staff Detail 13009:18226 (833x593)

## What to build

Playwright journeys assign a seeded property to a member from the picker, see its card, unassign it and see it back in the picker; a developer never sees another developer's properties, and the empty picker messages appear.

## Acceptance criteria

- [ ] Assign → card appears first with name, city and state and status badge; survives a reload
- [ ] Unassign → card gone; the property is back in the picker
- [ ] Another developer's seeded property never appears in the picker
- [ ] Picker empty states: all assigned → `allPropertiesAssigned`; no properties → `noProperties`
- [ ] A disabled member can be assigned
- [ ] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Cover images (STAFF-022)

## Verification

(filled when done)
