# PROP-027: Build Add Property steps 3–6 and the success modal

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-026
- **Cites:** PROP-SPEC-001 §Pages, PROP-DEC-012, PROP-DEC-017, PROP-DEC-018, PROP-DEC-023
- **Figma:** Step 3 [13009:10940](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10940), Step 4 [13009:11051](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11051), Step 5 [13009:11196](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11196), Step 6 [13009:11344](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11344), Success [13009:11599](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11599)

## What to build

The Developer adds configurations with floor plans, gallery media, documents and reviews everything, then submits. Each file uploads when chosen and shows progress, error and remove. On success a modal leads to the new property; on 422 the wizard jumps to the first step with an error.

## Acceptance criteria

- [ ] UI: a screenshot at 1440x900 matches the Figma frame 13009:10940, 13009:11051, 13009:11196, 13009:11344 and 13009:11599 (layout, spacing, tokens, text)
- [ ] UI: no horizontal page scroll and no overlap at 1366x768, 1280x720, 768x1024 and 375x812 (screenshots, per the spec responsive rule)
- [ ] UI: loading shows skeletons with `aria-busy`; an API error shows the message with a Retry button; a 404 shows "Property not found" with a link to My Properties
- [ ] UI: only Developers reach the page (`ProtectedRoute`); a non-Active Developer sees the 403 message with a link to the verification status page
- [ ] Validation: client messages equal the shared `propertyMessages` constants (same zod schema through `zodResolver`)
- [ ] Errors: server `error.fields` land on their fields through `applyServerErrors`; other errors show in a form-level alert; the submit button is disabled and busy while saving
- [ ] Each chosen file uploads at once to the staging endpoint; a refused file shows the server message on that file; remove drops its token
- [ ] Limits shown and enforced on the client: 1–20 configurations, 10 floor plans each, 1–30 images, 5 videos, 5 tours, 4 required documents, 5 Other
- [ ] Submit sends tokens, not files; on 422 the wizard jumps to the first step with an error and shows it on the field; on success the modal links to the property

## Out of scope

- Real API journey (PROP-034)

## Verification

_Filled when done._
