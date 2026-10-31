# PROP-031: Build the Documents tab and upload modal

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-029
- **Cites:** PROP-SPEC-001 §Pages, PROP-DEC-019
- **Figma:** Documents [13009:10202](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10202), Modal [13009:12013](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-12013)

## What to build

The Developer sees documents with status and category filters, uploads a new one choosing only addable types, replaces a file, and views or downloads through a signed link.

## Acceptance criteria

- [ ] UI: a screenshot at 1440x900 matches the Figma frame 13009:10202, modal 13009:12013 (layout, spacing, tokens, text)
- [ ] UI: no horizontal page scroll and no overlap at 1366x768, 1280x720, 768x1024 and 375x812 (screenshots, per the spec responsive rule)
- [ ] UI: loading shows skeletons with `aria-busy`; an API error shows the message with a Retry button; a 404 shows "Property not found" with a link to My Properties
- [ ] UI: only Developers reach the page (`ProtectedRoute`); a non-Active Developer sees the 403 message with a link to the verification status page
- [ ] Validation: client messages equal the shared `propertyMessages` constants (same zod schema through `zodResolver`)
- [ ] Errors: server `error.fields` land on their fields through `applyServerErrors`; other errors show in a form-level alert; the submit button is disabled and busy while saving
- [ ] The type select lists only `addableTypes`; the Upload button hides when none is left
- [ ] View opens the signed URL in a new tab; Download uses `disposition=attachment`; Replace uploads a new file and resets status to uploaded

## Out of scope

- Deleting documents (out of scope)
- E2E (PROP-038)

## Verification

_Filled when done._
