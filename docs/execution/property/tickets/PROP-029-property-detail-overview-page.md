# PROP-029: Build the Property Detail Overview with gallery viewer and upload

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-024
- **Cites:** PROP-SPEC-001 §Pages, PROP-DEC-018, PROP-DEC-022
- **Figma:** Overview [13009:7369](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7369), Overview (scrolled) [13009:7612](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7612), Viewer [13009:12356](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12356), Upload [13009:12032](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12032)

## What to build

The Developer sees the property header, facts, map, features and gallery, with tabs for Configuration, Documents, Update (under construction only) and Amenity. The gallery opens an image viewer, accepts uploads through a modal with a Type select, and deletes media (not the last image). Edit and Delete actions are in the header.

## Acceptance criteria

- [ ] UI: a screenshot at 1440x900 matches the Figma frame 13009:7369 / 13009:7612, viewer 13009:12356, upload modal 13009:12032 (layout, spacing, tokens, text)
- [ ] UI: no horizontal page scroll and no overlap at 1366x768, 1280x720, 768x1024 and 375x812 (screenshots, per the spec responsive rule)
- [ ] UI: loading shows skeletons with `aria-busy`; an API error shows the message with a Retry button; a 404 shows "Property not found" with a link to My Properties
- [ ] UI: only Developers reach the page (`ProtectedRoute`); a non-Active Developer sees the 403 message with a link to the verification status page
- [ ] Tabs of other modules are hidden; the Update tab shows only for under construction, and its route redirects to Overview otherwise
- [ ] The viewer moves with arrows and keyboard, closes on Escape and returns focus
- [ ] Upload modal: Type select (Image / Video / 360° tour), shared file messages, limits per type; the new item appears at the end
- [ ] Delete on the last image is disabled with the shared message as hint

## Out of scope

- Other tabs (PROP-030 to PROP-033)

## Verification

_Filled when done._
