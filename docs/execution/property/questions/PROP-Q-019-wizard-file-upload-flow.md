# PROP-Q-019: How does the Add Property wizard send its files?

- **Status:** answered (2026-10-31)
- **Blocks:** the create-property and wizard tickets
- **Asked by:** grill round 1, 2026-10-31

## Context

Submit ([13009:11344](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-11344)) must create the property and every child row in one transaction (PROP-DEC-005), but the wizard can carry many images, 40 MB videos, floor plans and four required documents.

## Options

1. (recommended) Upload each file when it is picked to a staging endpoint that returns a short-lived signed upload token; Submit sends JSON plus tokens; abandoned files are removed by the daily orphan job (DEC-018).
2. One multipart Submit with every file.
3. Create the property first, then upload files one by one.

## Answer

User, 2026-10-31 ("yes to all"): option 1. Recorded in [PROP-DEC-012](../decisions/PROP-DEC-012-wizard-upload-tokens.md).
