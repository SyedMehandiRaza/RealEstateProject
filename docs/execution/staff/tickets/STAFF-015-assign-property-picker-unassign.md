# STAFF-015: Build the Assign Property picker and Unassign on the Detail

- **Status:** ready-for-agent
- **Module:** staff
- **Blocked by:** STAFF-008, STAFF-009, STAFF-010, STAFF-014
- **Cites:** STAFF-SPEC-001 §Pages, §States; STAFF-DEC-009, STAFF-DEC-015
- **Figma:** Staff Detail 13009:18226 (833x593): Assigned Property; picker has no frame

## What to build

From the Detail, Assign Property opens a picker listing the developer's properties not yet assigned to this member; choosing one and pressing Assign adds its card to the Detail. Each card gets an Unassign link that removes it at once.

## Acceptance criteria

- [ ] The picker lists E7 results (placeholder cover, name, city and state, status badge); one can be selected; Assign is disabled until one is selected and while saving
- [ ] Empty picker shows `staffMessages.ui.allPropertiesAssigned`, or `staffMessages.ui.noProperties` when the developer has no properties (decided from the data the API gives)
- [ ] After Assign the picker closes and the card appears first in the Assigned Property panel; a 409 or 404 is shown in the picker's alert and the list refetches
- [ ] Unassign (no confirmation) calls E9 and the card disappears; errors show in the Detail alert
- [ ] The panel scrolls inside when the cards overflow
- [ ] UI: matches the Figma frame at its size (screenshot compared), and works at 1366x768, 1280x720, 768x1024 and 375x812 with no horizontal scroll and no overlap (responsive rule of the spec)
- [ ] Accessibility: every control has a label or accessible name and is keyboard-reachable; tests query by role or label
- [ ] `npm run check` passes

## Out of scope

- Cover images (STAFF-022)

## Verification

(filled when done)
