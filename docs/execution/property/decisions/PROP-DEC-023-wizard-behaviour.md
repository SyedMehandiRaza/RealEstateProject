# PROP-DEC-023: Add Property wizard behaviour

- **Status:** accepted (user, 2026-10-31)
- **Answers:** PROP-Q-032
- **Tickets:** wizard tickets

## Decision

- Each step validates only its own fields (the step's part of the shared create schema) when Next is pressed. Back keeps entries. The stepper marks finished steps; a finished step can be clicked to return to it.
- Data lives in memory only (React state / Redux, never localStorage). A reload or navigating away loses it; navigating away first asks "Leave this page? Your entries will be lost". Files already uploaded become orphans removed by the daily job (PROP-DEC-012).
- Files upload when picked (PROP-DEC-012), each with progress and its own error; Next is disabled while an upload runs.
- Submit sends one `POST /api/properties`. Success opens the "Property added" modal (13009:11599) with a link to the new property's detail page.
- On 422, the server's `fields` are mapped to the form and the wizard opens the first step with an error. Other errors show a form-level alert on step 6.

## Why

No draft state exists (PROP-DEC-005), so the browser holds the work; jumping to the error keeps it visible.

## Alternatives rejected

- Browser storage for the wizard: upload tokens and personal data would outlive the tab.
