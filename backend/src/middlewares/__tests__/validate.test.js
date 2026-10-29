import express from 'express';
import request from 'supertest';
import { commonMessages, idParamSchema, paginationQuerySchema, ERROR_CODES } from '@real-estate/shared';
import { validate } from '../validate.js';
import { errorHandler } from '../errorHandler.js';

const app = express();
app.get('/items/:id', validate({ params: idParamSchema, query: paginationQuerySchema }), (req, res) =>
  res.json(req.validated),
);
app.use(errorHandler);

describe('validate middleware', () => {
  it('passes parsed values on req.validated', async () => {
    const res = await request(app).get('/items/7?page=2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ params: { id: 7 }, query: { page: 2, pageSize: 20 } });
  });

  it('returns 422 with the exact shared messages for every invalid part', async () => {
    const res = await request(app).get('/items/abc?pageSize=0');
    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: ERROR_CODES.VALIDATION_ERROR.message,
        fields: {
          id: [commonMessages.id.invalid],
          pageSize: [commonMessages.pageSize.invalid],
        },
      },
    });
  });
});
