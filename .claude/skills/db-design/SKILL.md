---
name: db-design
description: Design or extend the MySQL schema for a module (entities, relationships, columns, indexes, constraints) and produce Sequelize models and migrations. Use when starting a module's data layer, adding tables or columns, or when the user asks to "design the DB", "create tables", "ERD", or "schema".
argument-hint: "<module-name> [extra context]"
---

# DB design (MySQL + Sequelize)

Follow `.claude/rules/database.md` for every decision. Work in the phases below and stop for the user's approval at each **[STOP]**.

## Phase 1: Gather
1. Read `docs/modules/<module>/README.md` (spec), `docs/modules/<module>/figma.md` (pages: every form field and list column hints at data), `docs/database/SCHEMA.md` (existing tables), `GLOSSARY.md` if present, and `docs/DECISIONS.md`.
2. If a Figma page is linked, you may read its metadata or design context to list the visible fields (load `figma-design-to-code` first if you call `get_design_context`).
3. List the candidate entities and attributes. Mark each as **confirmed** (from spec or user) or **assumed**.
4. Ask the user, in one batch, only the questions that change the schema, for example:
   - cardinality (can a property have many agents? can an image belong to many properties?)
   - ownership and deletion (what happens to listings when a user is deleted: restrict, cascade, or soft delete?)
   - uniqueness (is email unique? is a listing reference number unique per agency or globally?)
   - history/audit needs, soft delete, multi-tenancy, i18n, currency
   - expected volume and the main query patterns (filters, sort orders, search)
   For a deep session, suggest `/grill-with-docs` instead.

## Phase 2: Model **[STOP]**
Present:
- A Mermaid `erDiagram` with all tables, PK/FK and cardinalities.
- One table per entity: column | type | null | default | constraint | Zod rule it maps to | notes.
- Indexes, with the query each one serves.
- Every assumption, clearly labeled.
Wait for approval or corrections.

## Phase 3: Document
- Write or update `docs/modules/<module>/db.md` (tables, the module's ERD, personal-data columns with a retention note).
- Update `docs/database/SCHEMA.md` (global ERD plus a table index).
- Record non-obvious choices (denormalization, soft delete, UUIDs, ENUM vs lookup table) in `docs/DECISIONS.md`.

## Phase 4: Generate (only if `backend/` exists and the user asked for code)
- Migration files are CommonJS `.cjs` in `backend/src/migrations/` (the backend package is ESM). Name them `<YYYYMMDDHHmmss>-<action>.cjs`.
- Migration per table, in FK dependency order, using `queryInterface.createTable` with explicit `type`, `allowNull`, `defaultValue`, `references` + `onDelete`/`onUpdate`, then `addIndex`/`addConstraint` with the named conventions. Write a `down` that fully reverses it.
- A model per table with `underscored: true`, `tableName`, matching types/lengths, and `associate()` defining `belongsTo`/`hasMany`/`belongsToMany` with the same FK names and `as` aliases.
- Seeders only with synthetic data.
- Then run `/db-design-review` on the result, and make sure the Zod `max` and enum values in `shared/` match the columns (`/shared-validation`).

## Output checklist
- [ ] ERD and table specs approved by the user
- [ ] Every FK has an index and explicit ON DELETE/ON UPDATE behavior
- [ ] Every VARCHAR length matches the Zod max; every ENUM matches the Zod enum
- [ ] Money/area use DECIMAL; timestamps are present
- [ ] Docs updated (module db.md, SCHEMA.md, DECISIONS.md)
