import { Writable } from 'node:stream';
import { DatabaseError, ValidationError, ValidationErrorItem } from 'sequelize';
import { errorHandler } from '../../middlewares/errorHandler.js';
import { createLogger, logger } from '../logger.js';

// TASK-053: a Sequelize error carries the bound values (email, phone, name, password hash) in
// `parameters`, `original`/`parent` and `sql`. None of them may reach the log.
const SECRETS = {
  email: 'leak.me@example.com',
  phone: '+15550101234',
  name: 'Secret Person',
  passwordHash: '$2b$12$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ012',
};
const VALUES = Object.values(SECRETS);

// What mysql2 throws, as Sequelize wraps it.
function fakeDatabaseError() {
  const driverError = Object.assign(
    new Error(`Incorrect string value: '${SECRETS.name}' for column 'name' near '${SECRETS.email}'`),
    {
      code: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
      errno: 1366,
      sqlState: 'HY000',
      sqlMessage: `Incorrect string value: '${SECRETS.name}' for column 'name'`,
      sql: `INSERT INTO users (email, phone, name, password_hash) VALUES ('${VALUES.join("', '")}')`,
      parameters: VALUES,
    },
  );
  return new DatabaseError(driverError);
}

// A pino logger at info level whose output is collected as text.
function captureLogger() {
  let output = '';
  const destination = new Writable({
    write(chunk, _encoding, done) {
      output += chunk.toString();
      done();
    },
  });
  return { log: createLogger({ level: 'info', destination }), output: () => output };
}

const expectNoValues = (text) => {
  for (const value of VALUES) expect(text).not.toContain(value);
};

describe('logger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs a database error without its bound values, SQL or driver message', () => {
    const capture = captureLogger();

    capture.log.error({ err: fakeDatabaseError() }, 'Unhandled error');

    const output = capture.output();
    expectNoValues(output);
    const { err } = JSON.parse(output);
    expect(err).toMatchObject({
      type: 'SequelizeDatabaseError',
      code: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
      errno: 1366,
      sqlState: 'HY000',
    });
    expect(err.message).toBe("Incorrect string value: '?' for column '?' near '?'");
    expect(err.stack).toMatch(/^SequelizeDatabaseError: Incorrect string value: '\?'/);
    expect(err).not.toHaveProperty('sql');
    expect(err).not.toHaveProperty('parameters');
    expect(err).not.toHaveProperty('original');
    expect(err).not.toHaveProperty('parent');
  });

  it('logs a Sequelize validation error without the rejected values', () => {
    const capture = captureLogger();
    const error = new ValidationError('Validation error', [
      new ValidationErrorItem('bad email', 'Validation error', 'email', SECRETS.email),
    ]);

    capture.log.error({ err: error });

    expectNoValues(capture.output());
    expect(JSON.parse(capture.output()).err.type).toBe('SequelizeValidationError');
  });

  it('keeps every field of other errors', () => {
    const capture = captureLogger();
    const error = Object.assign(new Error('Cloudinary unavailable'), { publicId: 'documents/1/abc' });

    capture.log.error({ err: error });

    expect(JSON.parse(capture.output()).err).toMatchObject({
      type: 'Error',
      message: 'Cloudinary unavailable',
      publicId: 'documents/1/abc',
    });
  });

  it('the error handler logs an unhandled database error without its values', () => {
    const capture = captureLogger();
    jest.spyOn(logger, 'error').mockImplementation((...args) => capture.log.error(...args));
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    errorHandler(fakeDatabaseError(), { path: '/api/auth/sign-up', method: 'POST' }, res, () => {});

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expectNoValues(capture.output());
    expect(JSON.parse(capture.output()).err.code).toBe('ER_TRUNCATED_WRONG_VALUE_FOR_FIELD');
  });
});
