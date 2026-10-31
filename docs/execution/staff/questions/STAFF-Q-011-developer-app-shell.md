# STAFF-Q-011: Who builds the developer app shell (sidebar and top bar)?

- **Status:** answered (2026-10-31)
- **Blocks:** nothing
- **Asked by:** staff session, /grill-with-docs round 1, 2026-10-31

## Context

The Staff Management frame ([13009:17816](https://www.figma.com/design/iREXbZTABmZigGHBpTpOnz/Real-Estate--Claude-?node-id=13009-17816)) sits in a sidebar (Dashboard, My Properties, CRM, Marketing, Staff Management, Facility Management, Subscription, Support, Account, Log out) and a top bar (title, bell, avatar). It does not exist yet; property and facility need it too.

## Options

1. (recommended) Staff builds `DeveloperLayout` in `frontend/src/components/layout/` from Figma; only Staff Management and Log out work, other items link to their future routes (Not Found until built); the bell does nothing; the avatar shows initials. Below 1024 px the sidebar collapses behind a menu button. A note tells property and facility to reuse it.
2. A staff-only wrapper, if property already builds the shell.

## Answer

User, 2026-10-31: "yes" (option 1). Decision: [STAFF-DEC-008](../decisions/STAFF-DEC-008-shared-developer-layout.md).
