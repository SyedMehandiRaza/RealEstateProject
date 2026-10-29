# User preferences for this goal

- 2026-10-29: work through all tickets without asking before each one. After every ticket: `npm test`, `npm run lint`, `npx prettier --check .`, `npm run build` must pass, then one commit on `feature/auth` with the TASK id, BACKLOG status Done, STATUS.md updated. Never push.
- 2026-10-29: stop only for: missing business rule or doc conflict (log in QUESTIONS.md, keep going with independent tickets), a test still failing after 3 serious attempts (use `/diagnosing-bugs` first), destructive DB action, migration changing an existing table, a new dependency beyond nodemailer and multer, real credentials, Figma MCP or MySQL unavailable.
- 2026-10-29: finish with `/code-review`, `/db-design-review auth` (if schema changed), `/security-review`, fix findings, then a final report (tickets, test counts, unverified email/Cloudinary, Figma copy issues, open questions).
- Earlier sessions: user dislikes Python-based helpers ("we are using node"); use Node scripts.

See also [environment.md](environment.md).
