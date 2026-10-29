import nodemailer from 'nodemailer';
import { LIMITS } from '@real-estate/shared';
import { env } from '../../config/env.js';

// Email wording per Verification code purpose. Keys equal the verification_codes.purpose ENUM
// (a test compares them with the migration). Codes are digits only, so they are safe inside the HTML.
const TEMPLATES = {
  email_verification: {
    subject: 'Verify your email',
    text: (code) =>
      `Your verification code is ${code}.\n\n` +
      'Enter it on the Verify screen to confirm your email address. ' +
      'If you did not create an account, you can ignore this email.',
    html: (code) =>
      `<p>Your verification code is <strong>${code}</strong>.</p>` +
      '<p>Enter it on the Verify screen to confirm your email address. ' +
      'If you did not create an account, you can ignore this email.</p>',
  },
  password_reset: {
    subject: 'Reset your password',
    text: (code) =>
      `Your password reset code is ${code}.\n\n` +
      'Enter it on the Verify screen to choose a new password. ' +
      'If you did not ask to reset your password, you can ignore this email.',
    html: (code) =>
      `<p>Your password reset code is <strong>${code}</strong>.</p>` +
      '<p>Enter it on the Verify screen to choose a new password. ' +
      'If you did not ask to reset your password, you can ignore this email.</p>',
  },
};

export const VERIFICATION_PURPOSES = Object.freeze(Object.keys(TEMPLATES));

const CODE_PATTERN = new RegExp(`^\\d{${LIMITS.auth.codeLength}}$`);
// One plain address: no display name, list separators, whitespace or line breaks (header injection).
const SINGLE_ADDRESS = /^[^\s@,;<>"]+@[^\s@,;<>"]+$/;

// SMTP over implicit TLS (port 465, `secure: true`). nodemailer's own logging stays off, because it
// would print addresses and message content.
export function smtpTransportOptions(config) {
  return {
    host: config.SMTP_SERVICE_HOST,
    port: config.SMTP_SERVICE_PORT,
    secure: true,
    auth: { user: config.SMTP_USER_NAME, pass: config.SMTP_USER_PASSWORD },
    logger: false,
    debug: false,
  };
}

// The mailer passed to createApp({ mailer }). `transport` is anything with nodemailer's sendMail().
// Errors never contain the address, the code or the credentials, so callers may log them.
export function createMailer({ transport, from }) {
  return {
    async sendVerificationCode({ to, code, purpose }) {
      const template = Object.hasOwn(TEMPLATES, purpose) ? TEMPLATES[purpose] : undefined;
      if (!template) throw new Error('Unknown verification code purpose');
      if (typeof code !== 'string' || !CODE_PATTERN.test(code)) {
        throw new Error(`Verification code must be a ${LIMITS.auth.codeLength}-digit string`);
      }
      if (typeof to !== 'string' || !SINGLE_ADDRESS.test(to)) {
        throw new Error('Recipient must be a single email address');
      }

      try {
        await transport.sendMail({
          from,
          to,
          subject: template.subject,
          text: template.text(code),
          html: template.html(code),
        });
      } catch (error) {
        // Drop the original message and cause: SMTP errors can echo the recipient or the login.
        throw Object.assign(new Error('Failed to send the verification code email'), {
          code: error?.code,
          responseCode: error?.responseCode,
        });
      }
    },
  };
}

// No connection is opened until the first send.
const smtpTransport = nodemailer.createTransport(smtpTransportOptions(env));
const realMailer = createMailer({ transport: smtpTransport, from: env.MAIL_FROM });

// The production default. Under NODE_ENV=test it refuses to send, so a test that forgets to inject a
// fake mailer fails instead of emailing someone.
export const smtpMailer = {
  async sendVerificationCode(message) {
    if (env.isTest) {
      throw new Error('The SMTP mailer is disabled when NODE_ENV=test; inject a fake mailer');
    }
    return realMailer.sendVerificationCode(message);
  },
};
