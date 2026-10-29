import { idParamSchema, paginationQuerySchema } from '../common.schema.js';
import { commonMessages as m } from '../../messages/common.messages.js';
import { toFieldErrors } from '../../errors/toFieldErrors.js';
import { LIMITS } from '../../limits.js';

const fieldErrors = (schema, input) => toFieldErrors(schema.safeParse(input).error);

describe('idParamSchema', () => {
  it('accepts a positive integer string and coerces it', () => {
    expect(idParamSchema.parse({ id: '42' })).toEqual({ id: 42 });
  });

  it.each([['abc'], ['0'], ['-1'], ['1.5']])('rejects id "%s" with the shared message', (id) => {
    expect(fieldErrors(idParamSchema, { id }).id).toContain(m.id.invalid);
  });

  it('rejects unknown keys', () => {
    expect(idParamSchema.safeParse({ id: '1', extra: 'x' }).success).toBe(false);
  });
});

describe('paginationQuerySchema', () => {
  it('applies defaults', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: LIMITS.pagination.defaultPageSize });
  });

  it('accepts the max page size', () => {
    expect(paginationQuerySchema.parse({ pageSize: String(LIMITS.pagination.maxPageSize) }).pageSize).toBe(
      LIMITS.pagination.maxPageSize,
    );
  });

  it.each([
    ['page', '0', m.page.invalid],
    ['page', 'x', m.page.invalid],
    ['pageSize', '0', m.pageSize.invalid],
    ['pageSize', String(LIMITS.pagination.maxPageSize + 1), m.pageSize.invalid],
  ])('rejects %s=%s with the shared message', (field, value, message) => {
    expect(fieldErrors(paginationQuerySchema, { [field]: value })[field]).toContain(message);
  });
});
