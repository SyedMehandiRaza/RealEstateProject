# PROP-032: Build the Update tab with the progress and update modals

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-029
- **Cites:** PROP-SPEC-001 §Pages, PROP-DEC-010, PROP-DEC-021
- **Figma:** Update [13009:7876](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-7876), Progress modal [13009:10526](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10526), Update modal [13009:10615](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10615)

## What to build

For an under-construction property the Developer sees progress by phase with badges and the possession date, edits the five percentages in a modal, posts an update with an optional image, loads more updates and deletes one.

## Acceptance criteria

- [ ] UI: a screenshot at 1440x900 matches the Figma frame 13009:7876, modals 13009:10526 and 13009:10615 (layout, spacing, tokens, text)
- [ ] UI: no horizontal page scroll and no overlap at 1366x768, 1280x720, 768x1024 and 375x812 (screenshots, per the spec responsive rule)
- [ ] UI: loading shows skeletons with `aria-busy`; an API error shows the message with a Retry button; a 404 shows "Property not found" with a link to My Properties
- [ ] UI: only Developers reach the page (`ProtectedRoute`); a non-Active Developer sees the 403 message with a link to the verification status page
- [ ] Validation: client messages equal the shared `propertyMessages` constants (same zod schema through `zodResolver`)
- [ ] Errors: server `error.fields` land on their fields through `applyServerErrors`; other errors show in a form-level alert; the submit button is disabled and busy while saving
- [ ] Show more loads the next 10; a deleted update disappears after confirmation
- [ ] The update image accepts JPG/PNG only, with the shared message

## Out of scope

- Editing updates (out of scope)
- E2E (PROP-039)

## Verification

_Filled when done._
