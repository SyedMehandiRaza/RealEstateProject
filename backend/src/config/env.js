import 'dotenv/config';
import { z } from 'zod';

// MAIL_FROM is either a bare address or `Display Name <address>`.
const MAIL_FROM_WITH_NAME = /^\s*(.+?)\s*<([^<>\s]+)>\s*$/;
const emailAddress = z.email();
const isMailFrom = (value) => {
  const named = MAIL_FROM_WITH_NAME.exec(value);
  return emailAddress.safeParse(named ? named[2] : value).success;
};

// Validated once at startup; the app fails fast on missing or invalid configuration.
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    CORS_ORIGINS: z
      .string()
      .min(1)
      .transform((value) => value.split(',').map((origin) => origin.trim())),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    // Where verification documents are stored. Only Cloudinary is supported (DEC-016).
    CERTIFICATE_STORAGE: z.enum(['cloudinary']).default('cloudinary'),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    // Mailer (DEC-024): SMTP over implicit TLS, so only port 465 is accepted.
    SMTP_SERVICE_HOST: z.string().trim().min(1),
    SMTP_SERVICE_PORT: z.coerce.number().pipe(z.literal(465, { error: 'must be 465 (SMTP over TLS)' })),
    SMTP_USER_NAME: z.string().min(1),
    SMTP_USER_PASSWORD: z.string().min(1),
    MAIL_FROM: z
      .string()
      .trim()
      .refine(isMailFrom, { error: 'must be an email address or "Name <address>"' }),
    // HMAC-SHA256 key for Verification codes (DEC-015, DEC-021).
    VERIFICATION_CODE_SECRET: z.string().min(32),
  })
  .superRefine((value, ctx) => {
    if ([value.JWT_ACCESS_SECRET, value.JWT_REFRESH_SECRET].includes(value.VERIFICATION_CODE_SECRET)) {
      ctx.addIssue({
        code: 'custom',
        path: ['VERIFICATION_CODE_SECRET'],
        message: 'must differ from the JWT secrets',
      });
    }
  });

// Parses an environment object. Errors name the variable and the rule, never the value.
export function parseEnv(source) {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
  }
  return {
    ...parsed.data,
    isProduction: parsed.data.NODE_ENV === 'production',
    isTest: parsed.data.NODE_ENV === 'test',
    // Every upload goes under this folder; the orphan-cleanup job only ever touches files under it.
    cloudinaryPrefix: `realestate/${parsed.data.NODE_ENV}/`,
  };
}

export const env = parseEnv(process.env);
