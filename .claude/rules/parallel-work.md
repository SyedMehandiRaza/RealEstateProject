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
- Worktrees do not isolate databases, external services, credentials, or arbitrary filesystem access.
- Avoid multiple agents editing the same file concurrently.

## Completion report
Each task owner reports: files changed, implementation summary, tests run and results, migration/API changes, assumptions, risks, and remaining work.
