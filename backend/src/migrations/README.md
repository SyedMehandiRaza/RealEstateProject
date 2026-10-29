# Migrations

- Create: `npm run migration:new -w backend -- create-users`, then rename the generated `.js` to `.cjs`.
- Files are CommonJS (`module.exports = { async up(queryInterface, Sequelize) {...}, async down(...) {...} }`) because the backend package is ESM.
- Run: `npm run db:migrate -w backend`. Undo the last one: `npm run db:migrate:undo -w backend`.
- Rules: `.claude/rules/database.md`. Never edit a migration that already ran on a shared database.
