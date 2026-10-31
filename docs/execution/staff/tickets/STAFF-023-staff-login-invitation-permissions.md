# STAFF-023: Staff log in through an invitation and act within their permissions

- **Status:** blocked (waiting for STAFF-Q-014)
- **Module:** staff
- **Blocked by:** None; waiting for STAFF-Q-014
- **Cites:** STAFF-Q-014, STAFF-DEC-001, STAFF-DEC-007
- **Figma:** none (no invitation frames)

## What to build

A staff member receives an invitation, sets up or links an account, logs in to the developer panel and manages it on the employer's behalf, only within the granted areas and assigned properties; a disabled or removed member cannot act.

## Acceptance criteria

- [ ] Designed by the integration owner (STAFF-Q-014): account role, invitation storage and expiry, accept page, what a staff member sees
- [ ] Permission enforcement on the other modules' routes for staff accounts
- [ ] Disabled or removed members are refused
- [ ] `npm run check` passes

## Out of scope

- Everything until STAFF-Q-014 is planned

## Verification

(filled when done)
