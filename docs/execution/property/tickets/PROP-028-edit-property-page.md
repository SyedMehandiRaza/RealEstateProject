# PROP-028: Build the Edit Property page

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-026
- **Cites:** PROP-SPEC-001 §Pages, PROP-DEC-015
- **Figma:** layouts of Step 1 [13009:10644](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10644) and Step 2 [13009:10825](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10825)

## What to build

The Developer edits the step 1–2 fields of an existing property on one page, prefilled from the detail, and saves. Changing status explains what happens to progress and updates.

## Acceptance criteria

- [ ] UI: a screenshot at 1440x900 matches the Figma frame 13009:10644 / 13009:10825 (layout reuse) (layout, spacing, tokens, text)
- [ ] UI: no horizontal page scroll and no overlap at 1366x768, 1280x720, 768x1024 and 375x812 (screenshots, per the spec responsive rule)
- [ ] UI: loading shows skeletons with `aria-busy`; an API error shows the message with a Retry button; a 404 shows "Property not found" with a link to My Properties
- [ ] UI: only Developers reach the page (`ProtectedRoute`); a non-Active Developer sees the 403 message with a link to the verification status page
- [ ] Validation: client messages equal the shared `propertyMessages` constants (same zod schema through `zodResolver`)
- [ ] Errors: server `error.fields` land on their fields through `applyServerErrors`; other errors show in a form-level alert; the submit button is disabled and busy while saving
- [ ] The form is prefilled from the property; Save sends the edit body and returns to the Overview with the new values
- [ ] Possession date shows only for under construction; switching to ready to move shows a note that updates stay hidden

## Out of scope

- Editing configurations, media and documents (their tabs)

## Verification

_Filled when done._
