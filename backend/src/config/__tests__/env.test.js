import { parseEnv } from '../env.js';

// Dummy values only; never real credentials.
const validSource = () => ({
  NODE_ENV: 'test',
  CORS_ORIGINS: 'http://localhost:5173',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  CLOUDINARY_CLOUD_NAME: 'cloud',
  CLOUDINARY_API_KEY: 'key',
  CLOUDINARY_API_SECRET: 'secret',
  SMTP_SERVICE_HOST: 'smtp.example.com',
  SMTP_SERVICE_PORT: '465',
  SMTP_USER_NAME: 'mailer@example.com',
  SMTP_USER_PASSWORD: 'dummy-smtp-password',
  MAIL_FROM: 'Real Estate <no-reply@example.com>',
  VERIFICATION_CODE_SECRET: 'c'.repeat(32),
});

const without = (name) => {
  const source = validSource();
  delete source[name];
  return source;
};

describe('parseEnv', () => {
  it('accepts a complete configuration and coerces the SMTP port to a number', () => {
    const env = parseEnv(validSource());
    expect(env.SMTP_SERVICE_PORT).toBe(465);
    expect(env.SMTP_SERVICE_HOST).toBe('smtp.example.com');
    expect(env.MAIL_FROM).toBe('Real Estate <no-reply@example.com>');
    expect(env.isTest).toBe(true);
  });

  it.each([
    'SMTP_SERVICE_HOST',
    'SMTP_SERVICE_PORT',
    'SMTP_USER_NAME',
    'SMTP_USER_PASSWORD',
    'MAIL_FROM',
    'VERIFICATION_CODE_SECRET',
  ])('fails fast naming %s when it is missing', (name) => {
    expect(() => parseEnv(without(name))).toThrow(
      new RegExp(`^Invalid environment configuration:\\n${name}: `),
    );
  });

  it.each(['SMTP_SERVICE_HOST', 'SMTP_USER_NAME', 'SMTP_USER_PASSWORD', 'MAIL_FROM'])(
    'rejects an empty %s',
    (name) => {
      expect(() => parseEnv({ ...validSource(), [name]: '' })).toThrow(new RegExp(`\\n${name}: `));
    },
  );

  it.each(['587', '25', 'abc'])(
    'rejects SMTP_SERVICE_PORT=%s (the mailer only uses 465 with TLS)',
    (port) => {
      expect(() => parseEnv({ ...validSource(), SMTP_SERVICE_PORT: port })).toThrow(/\nSMTP_SERVICE_PORT: /);
    },
  );

  it.each([
    'no-reply@example.com',
    'Real Estate <no-reply@example.com>',
    '"Real Estate" <no-reply@example.com>',
  ])('accepts MAIL_FROM=%s', (from) => {
    expect(parseEnv({ ...validSource(), MAIL_FROM: from }).MAIL_FROM).toBe(from);
  });

  it.each(['not-an-email', 'Real Estate', 'Real Estate <not-an-email>', 'Real Estate no-reply@example.com'])(
    'rejects MAIL_FROM=%s',
    (from) => {
      expect(() => parseEnv({ ...validSource(), MAIL_FROM: from })).toThrow(/\nMAIL_FROM: /);
    },
  );

  it('rejects a VERIFICATION_CODE_SECRET shorter than 32 characters', () => {
    expect(() => parseEnv({ ...validSource(), VERIFICATION_CODE_SECRET: 'c'.repeat(31) })).toThrow(
      /\nVERIFICATION_CODE_SECRET: /,
    );
  });

  it.each(['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'])(
    'rejects a VERIFICATION_CODE_SECRET equal to %s',
    (jwtName) => {
      const source = validSource();
      source.VERIFICATION_CODE_SECRET = source[jwtName];
      expect(() => parseEnv(source)).toThrow(/\nVERIFICATION_CODE_SECRET: must differ from the JWT secrets/);
    },
  );

  it('rejects a JWT_REFRESH_SECRET equal to JWT_ACCESS_SECRET', () => {
    const source = validSource();
    source.JWT_REFRESH_SECRET = source.JWT_ACCESS_SECRET;
    expect(() => parseEnv(source)).toThrow(/\nJWT_REFRESH_SECRET: must differ from JWT_ACCESS_SECRET/);
  });

  it('does not trust a proxy by default', () => {
    expect(parseEnv(validSource()).TRUST_PROXY).toBe(false);
  });

  it.each([
    ['false', false],
    ['1', 1],
    [' 2 ', 2],
  ])('reads TRUST_PROXY=%p as %p', (value, expected) => {
    expect(parseEnv({ ...validSource(), TRUST_PROXY: value }).TRUST_PROXY).toBe(expected);
  });

  it.each(['true', '0', '-1', '1.5', 'loopback', ''])('rejects TRUST_PROXY=%p', (value) => {
    expect(() => parseEnv({ ...validSource(), TRUST_PROXY: value })).toThrow(/\nTRUST_PROXY: /);
  });

  it('never puts a value into the error, only the variable name', () => {
    const source = {
      ...validSource(),
      SMTP_USER_PASSWORD: '',
      VERIFICATION_CODE_SECRET: 'short-secret-value',
    };
    let message = '';
    try {
      parseEnv(source);
    } catch (error) {
      message = error.message;
    }
    expect(message).toMatch(/VERIFICATION_CODE_SECRET/);
    expect(message).not.toContain('short-secret-value');
    expect(message).not.toContain('mailer@example.com');
  });
});
