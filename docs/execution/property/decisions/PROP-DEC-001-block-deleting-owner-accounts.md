# PROP-DEC-001: A property is owned by a Developer account, and an account with properties or staff cannot be deleted

- **Status:** accepted (user, 2026-10-31). The owner column is the provisional recommended option of PROP-Q-001 (user will review); blocking the delete is the user's explicit answer to the property/staff conflict.
- **Answers:** PROP-Q-001; also decides the deletion part of [STAFF-Q-007](../../staff/questions/STAFF-Q-007-who-employs-staff.md)
- **Tickets:** none yet

## Decision

- `properties.owner_id` -> `users.id` is the Developer account that created the property. Only an Active developer (DEC-035 guard) creates, edits or deletes its own properties. Staff act on the owner's properties through the staff module (STAFF-DEC-005).
- Deleting a Developer account is **blocked** while it owns properties or employs staff members:
  - `fk_properties_users` (`properties.owner_id`) is `ON DELETE RESTRICT`.
  - `fk_staff_members_employer_users` (`staff_members.employer_id`) is `ON DELETE RESTRICT` (changed from CASCADE in the staff migration `20261030212742-create-staff-tables.cjs`, in place: it has never run).
- The auth user-deletion service (`backend/src/modules/auth/userDeletion.service.js`) checks first, inside its transaction and after locking the user row: if the user owns at least one property or employs at least one staff member, it throws `AppError('CONFLICT', { message: authMessages.api.accountHasPropertiesOrStaff })` (HTTP 409, "This account still owns properties or employs staff. Remove them before deleting the account"), so MySQL never raises a raw FK error. Nothing is queued and nothing is deleted.
- A user who is only linked as a staff member (`staff_members.user_id`) can still be deleted: that FK is `ON DELETE SET NULL` (STAFF-DEC-001).

### Auth change (the only one allowed for this decision)

- `shared/src/messages/auth.messages.js`: new `api.accountHasPropertiesOrStaff`, with a test in `shared/src/messages/__tests__/auth.messages.test.js`.
- `backend/src/modules/auth/userDeletion.service.js`: the check above. Unit tests in `backend/src/modules/auth/__tests__/userDeletion.service.test.js` (CONFLICT for properties, for staff, for both; counts inside the transaction; row locked before counting).
- No change to the auth migration, `user_roles` or any other auth file. An integration test on MySQL (`userDeletion.int.test.js`) for the 409 case is a follow-up, to add once MySQL is reachable again.

## Why

Properties and staff are the developer's business data, and properties will be referenced by leads, bookings and payments (PROP-DEC-002). Silently cascading an account deletion through all of that is irreversible. Blocking makes the developer remove (or later hand over) the data first, and checking in the service turns the FK rule into a clear 409 with a shared message instead of a 500.

The `SELECT ... FOR UPDATE` on the users row makes the check race-free: inserting a property or staff row for that owner needs a shared lock on the same users row for its FK check, so it waits until the deletion transaction ends.

## Alternatives rejected

- `ON DELETE CASCADE` for properties (PROP-Q-001 option 2) and staff (the STAFF-Q-007 recommendation): deletes listings, files and third-party personal data in one irreversible step, and would fail anyway once other modules reference properties with RESTRICT.
- Let MySQL raise the FK error: the client would get a 500 with no useful message.
- An organisation table that owns properties (PROP-Q-001 option 3): no frame shows it.
