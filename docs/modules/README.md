# Module Inventory

Each module has its own folder: copy `_template/` to `docs/modules/<module>/`.

- `README.md`: spec (scope, workflows, business rules, API contract, acceptance criteria)
- `figma.md`: Figma page registry (one row per page/frame, used by `/figma-to-module`)
- `db.md`: tables and ERD for the module (from `/db-design`)

Start a module with `/new-module <name>`.

| Module        | Folder         | Status                                          | Owner                | Dependencies       | Figma                     |
| ------------- | -------------- | ----------------------------------------------- | -------------------- | ------------------ | ------------------------- |
| [Module name] | [module-name/] | Discovery/Ready/In progress/Review/Done/Blocked | [Owner]              | [Dependencies]     | [figma.md]                |
| Auth          | [auth/](auth/) | Discovery (DB draft, not approved)              | db-architect (draft) | shared, migrations | [figma.md](auth/figma.md) |
