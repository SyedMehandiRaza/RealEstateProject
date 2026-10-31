# PROP-025: Build the My Properties page

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-024
- **Cites:** PROP-SPEC-001 §Pages, PROP-DEC-014, PROP-DEC-016
- **Figma:** My Properties [13009:7145](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7145)

## What to build

The Developer sees their properties as cards with search and paging, opens one, goes to Add Property, and deletes one through the confirmation modal. Empty states follow PROP-DEC-014.

## Acceptance criteria

- [ ] UI: a screenshot at 1440x900 matches the Figma frame 13009:7145 (layout, spacing, tokens, text)
- [ ] UI: no horizontal page scroll and no overlap at 1366x768, 1280x720, 768x1024 and 375x812 (screenshots, per the spec responsive rule)
- [ ] UI: loading shows skeletons with `aria-busy`; an API error shows the message with a Retry button; a 404 shows "Property not found" with a link to My Properties
- [ ] UI: only Developers reach the page (`ProtectedRoute`); a non-Active Developer sees the 403 message with a link to the verification status page
- [ ] Cards show cover, name, type, location, price range (or starting price), units and progress for under construction; counters from other modules show "–"
- [ ] Search is debounced and resets to page 1; paging works; empty list and empty search results show their own messages
- [ ] Delete opens the confirmation modal; confirm removes the card; an error shows in the modal

## Out of scope

- Real API journey (PROP-035)

## Verification

_Filled when done._
