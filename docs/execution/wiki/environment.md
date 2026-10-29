# Environment

- 2026-10-29: MySQL 8.4.9 runs locally on 127.0.0.1:3307 (XAMPP keeps 3306). If down, the user starts it with `C:\Users\HP\mysql84\start-mysql.cmd`.
- 2026-10-29: DB user `real_estate` has ALL on `real_estate` and `real_estate_test` only (cannot create databases).
- 2026-10-29: both draft migrations (`create-auth-tables`, `create-pending-file-deletions`) are already `up` on `real_estate` (dev). Changing those tables now needs a new migration and user approval (stop condition).
- 2026-10-29: `npm run dev -w backend` starts and `GET /api/health` returns 200.
- 2026-10-29: Figma MCP (desktop) is authenticated; file `iREXbZTABmZigGHBpTpOnz`, page node `13038:1697`. Frames listed in `docs/modules/auth/figma.md`.
- 2026-10-29: git baseline `72a116d` on `main`; all goal work on `feature/auth`, one commit per ticket, never pushed. Remote `origin` exists but the tracker is local (Q-006).

See also [gotchas.md](gotchas.md).
