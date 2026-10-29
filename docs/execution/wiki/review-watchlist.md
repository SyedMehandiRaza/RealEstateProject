# Review watchlist

Items noted during the auth goal for the final `/code-review`, `/db-design-review auth` and `/security-review`. Dated; each cites the commit or report it came from.

- 2026-10-29 (TASK-028, `7d29721`): POST `/api/auth/me/documents` buffers up to about 30 MB per request in memory (multer memory storage) and has no rate limit.
- 2026-10-29 (TASK-023, DEC-029): forgot/resend password reveals whether an email is registered (429 inside the cooldown for a known email, 200 always for an unknown one). Spec-accepted; confirm in the security review.
- 2026-10-29 (TASK-022, DEC-028, Q-038): any revoked refresh token presented to `/refresh` revokes all sessions (no rotated/logged-out distinction without a migration).
- 2026-10-29 (TASK-024, Q-040): access tokens stay valid up to `JWT_ACCESS_EXPIRES_IN` after a password reset.
- 2026-10-29 (TASK-021, DEC-027): per-account login limiter is in memory (per instance, lost on restart); dummy-hash timing equality not tested end to end.
- 2026-10-29 (TASK-046): if `navigator.locks.request` rejects, the request fails; no fallback.
- 2026-10-29 (TASK-020): `lockUserByEmail` FOR UPDATE serialization has no concurrency test.
- 2026-10-29 (coordinator): agent subagents never ran the migration round trip (`undo:all` blocked); user to run it.
