# STAFF-DEC-011: Add, Detail and Edit are modals with their own URLs; Edit reuses the Add form

- **Status:** accepted (user, 2026-10-31)
- **Answers:** STAFF-Q-015
- **Tickets:** set by /to-tickets

## Decision

- Routes: `/staff` (list), `/staff/new` (Add Staff), `/staff/:id` (Detail), `/staff/:id/edit` (Edit). Each modal opens over the list, so refresh, back and links work.
- Edit = the Add Staff modal titled "Edit Staff" with a "Save Changes" button, prefilled; every field is editable, email included (uniqueness still applies, STAFF-DEC-004). Permissions are replaced as a set.
- View (list) opens the Detail; Edit (list) and Edit (Detail) open Edit. After saving, Edit returns to where it was opened (the Detail or the list), with refreshed data and no success modal.
- After Add, the "Successfully Added" modal (13009:18180) shows; Done returns to the list.
- An unknown id or another developer's staff member: the API answers 404 and the modal shows "Staff member not found".

## Why

Figma has Add and Detail as modals and no Edit frame; URL-addressable modals keep refresh and back working.

## Alternatives rejected

- Separate full pages for Detail and Edit: not the Figma layout.
- A success modal after Edit: only Add has one in Figma.
