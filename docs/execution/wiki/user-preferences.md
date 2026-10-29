# User preferences for this goal

- 2026-10-29: work through all tickets without asking before each one. After every ticket: `npm test`, `npm run lint`, `npx prettier --check .`, `npm run build` must pass, then one commit on `feature/auth` with the TASK id, BACKLOG status Done, STATUS.md updated. Never push.
- 2026-10-29: stop only for: missing business rule or doc conflict (log in QUESTIONS.md, keep going with independent tickets), a test still failing after 3 serious attempts (use `/diagnosing-bugs` first), destructive DB action, migration changing an existing table, a new dependency beyond nodemailer and multer, real credentials, Figma MCP or MySQL unavailable.
- 2026-10-29: finish with `/code-review`, `/db-design-review auth` (if schema changed), `/security-review`, fix findings, then a final report (tickets, test counts, unverified email/Cloudinary, Figma copy issues, open questions).
- Earlier sessions: user dislikes Python-based helpers ("we are using node"); use Node scripts.

See also [environment.md](environment.md).

- 2026-10-30: the user added DEC-037 (commit 334eb80): branch flow feature/<module> -> testing -> main; Claude may push feature branches after npm run check. The goal brief (2026-10-29) said "Never push", so this goal still does not push; offer to push feature/auth at the end. The user's port-move edits are now committed (3306), so no more unstaged user hunks.
