# PROP-030: Build the Configuration tab and its modal

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-029
- **Cites:** PROP-SPEC-001 §Pages, PROP-DEC-017
- **Figma:** Configuration [13009:9932](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-9932), Modal [13009:10479](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10479)

## What to build

The Developer sees configurations in a table, adds and edits one in the modal (status when editing), manages its floor plans and deletes it (not the last one).

## Acceptance criteria

- [ ] UI: a screenshot at 1440x900 matches the Figma frame 13009:9932, modal 13009:10479 (layout, spacing, tokens, text)
- [ ] UI: no horizontal page scroll and no overlap at 1366x768, 1280x720, 768x1024 and 375x812 (screenshots, per the spec responsive rule)
- [ ] UI: loading shows skeletons with `aria-busy`; an API error shows the message with a Retry button; a 404 shows "Property not found" with a link to My Properties
- [ ] UI: only Developers reach the page (`ProtectedRoute`); a non-Active Developer sees the 403 message with a link to the verification status page
- [ ] Validation: client messages equal the shared `propertyMessages` constants (same zod schema through `zodResolver`)
- [ ] Errors: server `error.fields` land on their fields through `applyServerErrors`; other errors show in a form-level alert; the submit button is disabled and busy while saving
- [ ] Floor plans upload and delete from the modal, up to 10
- [ ] Delete of the last configuration is disabled with the shared message; the table scrolls inside its own container under 768

## Out of scope

- E2E (PROP-037)

## Verification

_Filled when done._
