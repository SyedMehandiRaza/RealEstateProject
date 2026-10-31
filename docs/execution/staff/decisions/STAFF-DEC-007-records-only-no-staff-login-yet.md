# STAFF-DEC-007: This build keeps staff as records only; staff login comes later

- **Status:** accepted (user, 2026-10-31)
- **Answers:** STAFF-Q-009
- **Tickets:** set by /to-tickets

## Decision

- Add Staff creates the record only: no email is sent and `staff_members.user_id` stays NULL. No endpoint in this module writes `user_id`.
- Permissions (`staff_member_permissions`) are stored, edited and shown, but not enforced anywhere, because no one logs in as staff yet.
- STAFF-DEC-001 (staff log in through an invitation) stays the target design. The staff account role, the invitation email and accept page, and permission enforcement are one blocked ticket waiting for STAFF-Q-014 (integration owner).
- This module changes no auth file, no `user_roles` value and no shared auth enum.

## Why

The login needs auth and shared foundation changes that the staff session must not make; the records, permissions and assignments are useful to the developer without it.

## Alternatives rejected

- Build the invitation and login here: edits auth and the shared auth enums from a module branch.
