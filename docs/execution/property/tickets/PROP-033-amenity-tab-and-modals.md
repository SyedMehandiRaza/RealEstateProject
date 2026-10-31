# PROP-033: Build the Amenity tab and its modals

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-029
- **Cites:** PROP-SPEC-001 §Pages, PROP-DEC-020
- **Figma:** Amenity [13009:8335](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-8335), modals add [13009:11821](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11821), edit [13009:11898](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11898), delete [13009:12402](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12402), success [13009:11589](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11589)

## What to build

The Developer searches and filters amenities, adds one with 1 to 5 plans (billing cycle options follow the pricing type), edits it including status, deletes it after confirmation, and sees the success modal.

## Acceptance criteria

- [ ] UI: a screenshot at 1440x900 matches the Figma frame 13009:8335, modals 13009:11821, 13009:11898, 13009:12402, 13009:11589 (layout, spacing, tokens, text)
- [ ] UI: no horizontal page scroll and no overlap at 1366x768, 1280x720, 768x1024 and 375x812 (screenshots, per the spec responsive rule)
- [ ] UI: loading shows skeletons with `aria-busy`; an API error shows the message with a Retry button; a 404 shows "Property not found" with a link to My Properties
- [ ] UI: only Developers reach the page (`ProtectedRoute`); a non-Active Developer sees the 403 message with a link to the verification status page
- [ ] Validation: client messages equal the shared `propertyMessages` constants (same zod schema through `zodResolver`)
- [ ] Errors: server `error.fields` land on their fields through `applyServerErrors`; other errors show in a form-level alert; the submit button is disabled and busy while saving
- [ ] Plans: add and remove rows within 1–5; billing cycle options are month for subscription and hour/day for time based
- [ ] Filters and search update the list and reset to page 1; the empty state follows PROP-DEC-020

## Out of scope

- Booking (out of scope)
- E2E (PROP-040)

## Verification

_Filled when done._
