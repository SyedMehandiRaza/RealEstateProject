import { ERROR_CODES } from '@real-estate/shared';

// Operational error with a shared error code. The error handler turns it into the API error contract.
export class AppError extends Error {
  constructor(code, { message, fields } = {}) {
    const definition = ERROR_CODES[code] ?? ERROR_CODES.INTERNAL_ERROR;
    super(message ?? definition.message);
    this.name = 'AppError';
    this.code = ERROR_CODES[code] ? code : 'INTERNAL_ERROR';
    this.status = definition.status;
    this.fields = fields;
  }
}
