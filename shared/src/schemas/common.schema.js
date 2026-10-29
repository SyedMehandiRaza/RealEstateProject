import { z } from 'zod';
import { LIMITS } from '../limits.js';
import { commonMessages as m } from '../messages/common.messages.js';

export const idParamSchema = z.strictObject({
  id: z.coerce.number({ error: m.id.invalid }).int(m.id.invalid).positive(m.id.invalid),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number({ error: m.page.invalid }).int(m.page.invalid).min(1, m.page.invalid).default(1),
  pageSize: z.coerce
    .number({ error: m.pageSize.invalid })
    .int(m.pageSize.invalid)
    .min(1, m.pageSize.invalid)
    .max(LIMITS.pagination.maxPageSize, m.pageSize.invalid)
    .default(LIMITS.pagination.defaultPageSize),
});
