import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  DEVELOPER_TYPES,
  DOCUMENT_KINDS,
  DOCUMENT_MIME_TYPES,
  DOCUMENT_STATUSES,
  EXPERIENCE_LEVELS,
  ID_DOCUMENT_TYPES,
  LIMITS,
  USER_ROLES,
} from '@real-estate/shared';

// Migrations are CommonJS and cannot import the shared ESM package, so they repeat ENUM values and
// column lengths as literals. These tests keep them equal to shared/. Jest runs with backend/ as the cwd.
const migration = readFileSync(
  path.join(process.cwd(), 'src/migrations/20261028183255-create-auth-tables.cjs'),
  'utf8',
);

const columnType = (column) => {
  const match = new RegExp(`\\b${column}: \\{\\s*type: ([^\\n]+?),\\s*(allowNull|$)`, 'm').exec(migration);
  if (!match) throw new Error(`column ${column} not found in the migration`);
  return match[1];
};

const enumValues = (column) => {
  const match = /Sequelize\.ENUM\(([^)]*)\)/.exec(columnType(column));
  if (!match) throw new Error(`${column} is not an ENUM`);
  return match[1].split(',').map((value) => value.trim().replace(/'/g, ''));
};

const varcharLength = (column) => {
  const match = /(?:STRING|VARCHAR)\((\d+)\)/.exec(columnType(column));
  if (!match) throw new Error(`${column} has no VARCHAR length`);
  return Number(match[1]);
};

describe('auth migration matches shared enums', () => {
  it.each([
    ['role', USER_ROLES],
    ['business_type', DEVELOPER_TYPES],
    ['experience_level', EXPERIENCE_LEVELS],
    ['document_kind', DOCUMENT_KINDS],
    ['id_document_type', ID_DOCUMENT_TYPES],
    ['mime_type', DOCUMENT_MIME_TYPES],
    ['status', DOCUMENT_STATUSES],
  ])('%s', (column, values) => {
    expect(enumValues(column)).toEqual(values);
  });
});

describe('auth migration matches shared limits', () => {
  const A = LIMITS.auth;
  it.each([
    ['full_name', A.fullName.max],
    ['email', A.email.max],
    ['phone', A.phone.max],
    ['organization_name', A.companyName.max],
    ['license_number', A.licenseNumber.max],
    ['location', A.location.max],
    ['original_filename', A.fileName.max],
    ['rejection_reason', A.rejectionReason.max],
  ])('%s length', (column, max) => {
    expect(varcharLength(column)).toBe(max);
  });

  it('file size CHECK matches the shared maximum', () => {
    expect(migration).toContain(`\`size_bytes\` BETWEEN 1 AND ${A.maxFileBytes}`);
  });
});
