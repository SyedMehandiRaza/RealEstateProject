# STAFF-DEC-013: Remove asks for confirmation in a small modal

- **Status:** accepted (user, 2026-10-31)
- **Answers:** STAFF-Q-017
- **Tickets:** set by /to-tickets

## Decision

- Remove (list) and Remove Staff (Detail) open a confirmation modal in the success modal's style: "Remove <name>?" and "Their access permissions and property assignments will be deleted. This cannot be undone.", with Cancel and a red Remove.
- On success it goes back to the list, refreshed. A member already removed (another tab) gets 404, and the list refreshes anyway.
- The delete itself is STAFF-DEC-003 (hard delete, CASCADE).

## Why

A hard delete of a person's record must not be one stray click; Figma has no frame for it.

## Alternatives rejected

- No confirmation: irreversible on one click.
