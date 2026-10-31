# STAFF-DEC-014: Status changes at once from the Detail dropdown only

- **Status:** accepted (user, 2026-10-31)
- **Answers:** STAFF-Q-018
- **Tickets:** set by /to-tickets

## Decision

- The Detail status dropdown (Active / Disable) saves immediately, with no confirmation; the Detail status text and the list update (green "Active", red "Disable").
- The Figma typo "Acive" is shown as "Active". Stored values stay `active` / `disabled`.
- The list has no status control.
- A disabled member can still be edited, assigned properties and removed. While no one logs in as staff (STAFF-DEC-007), Disable has no other effect.

## Why

Status is reversible, so a confirmation adds nothing; Figma has the control only on the Detail.

## Alternatives rejected

- A status toggle in the list: not designed.
