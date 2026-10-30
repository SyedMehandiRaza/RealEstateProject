import { readFileSync } from 'node:fs';
import path from 'node:path';

// Reads a migration as text, for the enum and limit parity tests. Migrations are CommonJS and cannot import
// the shared ESM package, so they repeat ENUM values and column lengths as literals. Jest runs with
// backend/ as the cwd. Columns are looked up inside one createTable(...) block, so the same column name in
// two tables never matches the wrong one. A block that spreads `...<helper>(` is also searched in the body
// of `const <helper> = ...` (for example documentFileColumns in the property migration).
export function readMigration(file) {
  const text = readFileSync(path.join(process.cwd(), 'src/migrations', file), 'utf8');

  const helperBody = (helper) => {
    const start = text.indexOf(`const ${helper} = `);
    if (start === -1) throw new Error(`helper ${helper} not found in ${file}`);
    return text.slice(start, text.indexOf('\n});', start));
  };

  const tableBlock = (table) => {
    const start = text.search(new RegExp(`createTable\\(\\s*'${table}',`));
    if (start === -1) throw new Error(`table ${table} not found in ${file}`);
    const block = text.slice(start, text.indexOf('TABLE_OPTIONS', start));
    const helpers = [...block.matchAll(/\.\.\.(\w+)\(/g)].map((match) => match[1]);
    return [block, ...helpers.filter((name) => name !== 'timestamps').map(helperBody)].join('\n');
  };

  // The type expression of one column, for example "Sequelize.ENUM('a', 'b')" or "`VARCHAR(255) ...`".
  const columnType = (table, column) => {
    const block = tableBlock(table);
    const match = new RegExp(`\\b${column}: \\{\\s*type:\\s*`).exec(block);
    if (!match) throw new Error(`column ${table}.${column} not found in ${file}`);
    const rest = block.slice(match.index + match[0].length);
    const type = /^(Sequelize\.ENUM\([^)]*\)|Sequelize\.\w+(\.\w+)?(\([^)]*\))?|`[^`]*`)/.exec(rest);
    if (!type) throw new Error(`cannot read the type of ${table}.${column}`);
    return type[1];
  };

  const enumValues = (table, column) => {
    const match = /^Sequelize\.ENUM\(([^)]*)\)$/.exec(columnType(table, column));
    if (!match) throw new Error(`${table}.${column} is not an ENUM`);
    return match[1]
      .split(',')
      .map((value) => value.trim().replace(/'/g, ''))
      .filter(Boolean);
  };

  const varcharLength = (table, column) => {
    const match = /^(?:Sequelize\.STRING\((\d+)\)|`VARCHAR\((\d+)\))/.exec(columnType(table, column));
    if (!match) throw new Error(`${table}.${column} has no VARCHAR length`);
    return Number(match[1] ?? match[2]);
  };

  return { text, columnType, enumValues, varcharLength };
}
