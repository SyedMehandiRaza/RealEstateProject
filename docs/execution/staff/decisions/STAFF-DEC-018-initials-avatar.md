# STAFF-DEC-018: Avatars show initials; no photo upload

- **Status:** accepted (user, 2026-10-31)
- **Answers:** STAFF-Q-022
- **Tickets:** set by /to-tickets

## Decision

- The staff list has no avatar (as in Figma). The Detail shows a circle with the member's initials (first letters of the first and last words of the full name; one letter for a one-word name) in place of the photo. The top bar avatar of `DeveloperLayout` shows the developer's initials the same way.
- No upload field and no column.

## Why

No frame has a photo upload; the staff tables have no image column.

## Alternatives rejected

- A photo upload: not designed, needs Cloudinary storage and a migration.
