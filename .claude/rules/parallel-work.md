# Parallel Development Rules

## Before assigning work
- Define task scope, dependencies, acceptance criteria, and allowed files.
- Identify shared files, shared services, schema changes, and integration points.
- Give each task an explicit owner (person or agent responsible for its changes and review readiness).
- Prefer tasks with low overlap in files and responsibilities.

## File ownership
- Module agents own their assigned module files.
- Shared foundations (application bootstrap, global routing/registration, auth, authorization, configuration, shared contracts, common utilities) have a designated owner.
- A task owner may propose shared changes but must document them and coordinate with the shared-file owner.
- Ownership is a workflow convention, not a technical access restriction unless separately enforced.

## Interfaces and integration
- Agree on API/event contracts, data ownership, error formats, and shared types before splitting dependent frontend/backend work.
- Do not silently change public interfaces or shared schemas.
- Each agent must document any cross-module dependency or requested change.
- Integrate in small increments; review and test each change before merging.
- Resolve conflicts intentionally; never blindly accept one side of a conflict.

## Git worktrees
- Use a distinct branch and working directory for each independent task when appropriate.
- Do not check out the same branch in multiple worktrees at the same time.
- Worktrees share repository history but have separate working files and uncommitted changes.
- A commit in one worktree does not automatically update another worktree's files; merge, rebase, or cherry-pick as appropriate.
- Worktrees do not isolate databases, external services, credentials, or arbitrary filesystem access. Module folders get their own databases and ports through `backend/.env` and `.env.worktree` (`docs/execution/README.md`).
- Avoid multiple agents editing the same file concurrently.

### Naming sub-agent worktrees
A session that gives a ticket to a sub-agent in its own worktree names the branch and folder after the ticket, so anyone can tell what each one is doing:
- Branch: `agent/<module>/<TICKET-ID>-<slug>`, for example `agent/property/PROP-004-list-properties`.
- Folder: `.claude/worktrees/<TICKET-ID>-<slug>`, for example `.claude/worktrees/PROP-004-list-properties`.
- Create it yourself before starting the sub-agent: `git worktree add -b agent/property/PROP-004-list-properties .claude/worktrees/PROP-004-list-properties feature/property`. Then start the sub-agent **without** the automatic worktree option and tell it the folder's absolute path, that it works and commits only there, and on which branch.
- If a worktree was created automatically (`worktree-agent-<random>`), rename its branch right away: `git branch -m worktree-agent-<random> agent/<module>/<TICKET-ID>-<slug>`.
- One sub-agent per ticket, and never two sub-agents editing the same file at once (shared/, migrations, routes/index.js, models/index.js are done by the module session itself, not by sub-agents in parallel).

### Removing worktrees (user rule, 2026-10-31)
- **Task worktrees are removed as soon as the task is done**, without asking: once the ticket's commits are on the module branch (merged or cherry-picked, checked with `git log`) and the worktree has no uncommitted changes, run `git worktree remove .claude/worktrees/<TICKET-ID>-<slug>` and `git worktree prune`. Never use `--force`; if it refuses, report why.
- **Module folders** (`Real_Estate-<module>`) are removed **only when the user says so**. Before removing: everything is committed and pushed to `feature/<module>`; then `git worktree remove ..\Real_Estate-<module>`.
- **Branches are never deleted** when a worktree is removed: not the `agent/...` task branches, not `feature/<module>`, not on GitHub. Delete a branch only when the user asks for that branch by name.
- The module's code and docs stay on its branch (and in `testing`/`main` once merged); removing a folder removes only that copy on disk. Its databases are kept too unless the user asks to drop them.

## Completion report
Each task owner reports: files changed, implementation summary, tests run and results, migration/API changes, assumptions, risks, and remaining work.
