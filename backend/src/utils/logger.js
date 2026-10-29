import pino from 'pino';
import { BaseError } from 'sequelize';
import { env } from '../config/env.js';

// Quoted text in a database message ('...' or "...", also when cut off at the end) is a bound value.
const QUOTED = /'(?:[^'\\]|\\.)*(?:'|$)|"(?:[^"\\]|\\.)*(?:"|$)/g;
const redactQuoted = (text) => String(text ?? '').replace(QUOTED, "'?'");

// A Sequelize error, or a driver error that carries its query.
const isDatabaseError = (err) =>
  err instanceof BaseError || (err instanceof Error && ('sql' in err || 'parameters' in err));

// The `err` serializer (TASK-053, DEC-040). A database error carries the bound values (email, phone,
// name, password hash) in `parameters`, `sql`, `original`/`parent` and the driver message, and pino would
// copy every key, so only a whitelist is logged: the error's name, the driver's code, errno and SQL state,
// the message with every quoted value replaced by '?', and the stack frames. Other errors keep pino's
// standard serializer.
export function serializeError(err) {
  if (!isDatabaseError(err)) return pino.stdSerializers.err(err);
  const driver = err.original ?? err.parent ?? err;
  const message = redactQuoted(err.message);
  const frames =
    typeof err.stack === 'string' ? err.stack.split('\n').filter((line) => /^\s+at /.test(line)) : [];
  return {
    type: err.name,
    message,
    code: driver.code,
    errno: driver.errno,
    sqlState: driver.sqlState,
    stack: [`${err.name}: ${message}`, ...frames].join('\n'),
  };
}

// `destination` is for tests (an in-memory stream); the app logs to stdout.
export function createLogger({ level, destination } = {}) {
  return pino(
    {
      level,
      serializers: { err: serializeError },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          '*.password',
          // Belt and braces next to serializeError, for a database error logged under another key.
          '*.parameters',
          '*.sql',
          '*.original',
          '*.parent',
        ],
        censor: '[redacted]',
      },
    },
    destination,
  );
}

export const logger = createLogger({ level: env.LOG_LEVEL });
