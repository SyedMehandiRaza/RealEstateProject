# STAFF-021: Security review of the staff module and fixes

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-020
- **Cites:** .claude/rules/security.md
- **Figma:** none

## What to build

Run `/security-review` on the staff changes: authorization on every route, row-level ownership, mass assignment, enumeration through 404s, personal data in logs, and the e2e-only routes. Confirmed findings are fixed test-first.

## Acceptance criteria

- [x] Review run and findings listed in Verification
- [x] Each confirmed finding has a failing test first, then the fix
- [x] Tests prove: no staff route answers without an Active developer; no response or log contains another developer's data or staff personal data in logs; e2e seed routes are absent from the regular app
- [x] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Auth module findings (reported, not fixed here)

## Verification

- `/security-review` run on 2026-10-31 over the branch diff, done inline in this session (no sub-agents, per the user's rule for this run), focused on the staff changes. Result: no vulnerability with confidence 8 or more; nothing to fix.
- Checked: every staff route is behind `authenticate` + `requireActiveDeveloper` (DB-derived Active status on each request); every repository query is scoped by `employerId` / `ownerId`, and the assign / unassign / assignable paths verify the member (row lock) and the property owner first, so foreign ids get 404; request bodies are strict Zod objects and the repository copies named fields only (no mass assignment); no string-built SQL (the one `$staffAssignments.id# STAFF-021: Security review of the staff module and fixes

- **Status:** done (2026-10-31)
- **Module:** staff
- **Blocked by:** STAFF-020
- **Cites:** .claude/rules/security.md
- **Figma:** none

## What to build

Run `/security-review` on the staff changes: authorization on every route, row-level ownership, mass assignment, enumeration through 404s, personal data in logs, and the e2e-only routes. Confirmed findings are fixed test-first.

## Acceptance criteria

- [x] Review run and findings listed in Verification
- [x] Each confirmed finding has a failing test first, then the fix
- [x] Tests prove: no staff route answers without an Active developer; no response or log contains another developer's data or staff personal data in logs; e2e seed routes are absent from the regular app
- [x] `npm run check` passes; `npm run test:e2e` passes

## Out of scope

- Auth module findings (reported, not fixed here)

key is a constant, values are bound); responses never carry `employerId`, `userId` or file ids; no `dangerouslySetInnerHTML` or dynamic code in the staff UI; DB errors are logged through the existing whitelist serializer (DEC-040), so staff emails in unique-index errors are not logged; the e2e seed route exists only in the e2e app (listening on 127.0.0.1) and `e2eMode.test.js` proves the regular app has no `/seed/staff`.

- Tests that prove the access rules: the 401 / 403 FORBIDDEN / 403 DEVELOPER_NOT_ACTIVE and foreign-id 404 cases in every `backend/src/modules/staff/__tests__/*.int.test.js`.
- Out of scope, noted for the user: the code review's `PUBLIC_AUTH_PATHS` finding in `frontend/src/services/api/baseApi.js` belongs to auth (TASK-049).
