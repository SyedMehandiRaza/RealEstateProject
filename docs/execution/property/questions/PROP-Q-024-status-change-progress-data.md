# PROP-Q-024: What happens to progress and updates when the property status changes?

- **Status:** answered (2026-10-31)
- **Blocks:** the edit-property API ticket
- **Asked by:** grill round 2, 2026-10-31

## Context

Construction progress and updates exist only for under-construction properties (PROP-DEC-010), and Edit can change the status.

## Options

1. (recommended) To under construction: create the progress row at 0% if missing. Back to ready to move: keep the progress row and updates, hide the Update tab and the % bar. Possession date shown only for under construction, optional, any valid date.
2. Delete progress and updates when the status goes back to ready to move.

## Answer

User, 2026-10-31 ("yes for all"): option 1. Recorded in [PROP-DEC-015](../decisions/PROP-DEC-015-edit-property-and-status-change.md).
