# PROP-026: Build Add Property steps 1–2 with the map picker

- **Status:** ready-for-agent
- **Module:** property
- **Blocked by:** PROP-024
- **Cites:** PROP-SPEC-001 §Pages, PROP-DEC-004, PROP-DEC-023, PROP-Q-033
- **Figma:** Step 1 [13009:10644](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10644), Step 2 [13009:10825](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-10825)

## What to build

The Developer fills basic information and location (with a Leaflet + OpenStreetMap pin picker) and property details, validated per step before Next. Data stays in memory, and leaving with unsaved data asks for confirmation.

## Acceptance criteria

- [ ] UI: a screenshot at 1440x900 matches the Figma frame 13009:10644 and 13009:10825 (layout, spacing, tokens, text)
- [ ] UI: no horizontal page scroll and no overlap at 1366x768, 1280x720, 768x1024 and 375x812 (screenshots, per the spec responsive rule)
- [ ] UI: loading shows skeletons with `aria-busy`; an API error shows the message with a Retry button; a 404 shows "Property not found" with a link to My Properties
- [ ] UI: only Developers reach the page (`ProtectedRoute`); a non-Active Developer sees the 403 message with a link to the verification status page
- [ ] Validation: client messages equal the shared `propertyMessages` constants (same zod schema through `zodResolver`)
- [ ] Errors: server `error.fields` land on their fields through `applyServerErrors`; other errors show in a form-level alert; the submit button is disabled and busy while saving
- [ ] Next validates only the current step's fields (`PROP_WIZARD_STEP_FIELDS`); Back keeps values
- [ ] The map pin sets latitude and longitude (6 decimals); typing coordinates moves the pin; the map works by keyboard
- [ ] Country select shows AE, GB, IN, SG, US by name; possession date shows only for under construction
- [ ] Leaving the wizard with data asks for confirmation
- [ ] UI: under 768 the stepper shows "Step n of 6" with the step name

## Out of scope

- Steps 3–6 and Submit (PROP-027)

## Verification

_Filled when done._
