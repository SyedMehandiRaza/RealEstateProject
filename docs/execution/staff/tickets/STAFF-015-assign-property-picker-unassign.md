# STAFF-015: Build the Assign Property picker and Unassign on the Detail

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-008, STAFF-009, STAFF-010, STAFF-014
- **Cites:** STAFF-SPEC-001 §Pages, §States; STAFF-DEC-009, STAFF-DEC-015
- **Figma:** Staff Detail 13009:18226 (833x593): Assigned Property; picker has no frame

## What to build

From the Detail, Assign Property opens a picker listing the developer's properties not yet assigned to this member; choosing one and pressing Assign adds its card to the Detail. Each card gets an Unassign link that removes it at once.

## Acceptance criteria

- [x] The picker lists E7 results (placeholder cover, name, city and state, status badge); one can be selected; Assign is disabled until one is selected and while saving
- [x] Empty picker shows `staffMessages.ui.allPropertiesAssigned`, or `staffMessages.ui.noProperties` when the developer has no properties (decided from the data the API gives)
- [x] After Assign the picker closes and the card appears first in the Assigned Property panel; a 409 or 404 is shown in the picker's alert and the list refetches
- [x] Unassign (no confirmation) calls E9 and the card disappears; errors show in the Detail alert
- [x] The panel scrolls inside when the cards overflow
- [x] UI: matches the Figma frame at its size (screenshot compared), and works at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal scroll and no overlap (responsive rule of the spec)
- [x] Accessibility: every control has a label or accessible name and is keyboard-reachable; tests query by role or label
- [x] `npm run check` passes

## Out of scope

- Cover images (STAFF-022)

## Verification

- Test-first: `AssignProperty.test.jsx` was red (7 of 7 failing), then green.
- `frontend/src/modules/staff/pages/StaffDetailModal/__tests__/AssignProperty.test.jsx`: 7 tests (picker lists the assignable properties with location and badge, Assign disabled until one is chosen, POST `{ propertyId }`, the card appears first in the Detail; `ui.noProperties` when the developer has none; `ui.allPropertiesAssigned` when the member has them all; 409 `api.alreadyAssigned` in the picker alert and the list reloads; Cancel closes without assigning; Unassign removes the card at once; an Unassign error shows in the Detail alert and keeps the card).
- New: `AssignPropertyModal` (radio list, one property per Assign), `listAssignableProperties` / `assignProperty` / `unassignProperty` endpoints (the returned member replaces the Detail cache; the picker list refetches after every assign or unassign, also on errors), Unassign text button on each card, Assign Property button (Figma 13009:18348).
- Screenshot check (mocked API): the Detail is now 833 x 594 against Figma's 833 x 593 with Assign Property at the panel bottom; picker at 1440x832 and 375x812 without horizontal scroll. Picker and Unassign are not in Figma (STAFF-DEC-015).
- `npm run check`: shared 274, backend unit 454, backend integration 460 + 1 skipped, frontend 337; lint, format, build green.
