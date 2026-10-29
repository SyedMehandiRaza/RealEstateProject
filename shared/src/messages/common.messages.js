import { LIMITS } from '../limits.js';

export const commonMessages = {
  invalidInput: 'Please correct the highlighted fields',
  unknownField: 'Request contains fields that are not allowed',
  id: {
    invalid: 'Invalid id',
  },
  page: {
    invalid: 'Page must be a whole number of 1 or more',
  },
  pageSize: {
    invalid: `Page size must be a whole number between 1 and ${LIMITS.pagination.maxPageSize}`,
  },
};
