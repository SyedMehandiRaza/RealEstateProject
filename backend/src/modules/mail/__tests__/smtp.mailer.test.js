import { readFileSync } from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { createMailer, smtpMailer, smtpTransportOptions, VERIFICATION_PURPOSES } from '../smtp.mailer.js';

const FROM = 'Real Estate <no-reply@example.com>';
const TO = 'buyer@example.com';

// nodemailer's JSON transport builds the full message without opening any connection.
const jsonMailer = () => {
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const sent = [];
  const recording = {
    async sendMail(message) {
      const info = await transport.sendMail(message);
      sent.push(JSON.parse(info.message));
      return info;
    },
  };
  return { mailer: createMailer({ transport: recording, from: FROM }), sent };
};

describe('smtpTransportOptions', () => {
  const env = {
    SMTP_SERVICE_HOST: 'smtp.example.com',
    SMTP_SERVICE_PORT: 465,
    SMTP_USER_NAME: 'mailer@example.com',
    SMTP_USER_PASSWORD: 'dummy-password',
  };

  it('uses SMTP over TLS on port 465 with the env credentials', () => {
    expect(smtpTransportOptions(env)).toMatchObject({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: { user: 'mailer@example.com', pass: 'dummy-password' },
    });
  });

  it('turns nodemailer logging off, so no address, code or credential reaches a log', () => {
    expect(smtpTransportOptions(env)).toMatchObject({ logger: false, debug: false });
  });
});

describe('createMailer().sendVerificationCode', () => {
  it.each([
    ['email_verification', /verify your email/i],
    ['password_reset', /reset your password/i],
  ])('sends a %s message from MAIL_FROM containing the 6-digit code', async (purpose, subject) => {
    const { mailer, sent } = jsonMailer();
    await mailer.sendVerificationCode({ to: TO, code: '012345', purpose });

    expect(sent).toHaveLength(1);
    const [message] = sent;
    expect(message.from).toEqual({ name: 'Real Estate', address: 'no-reply@example.com' });
    expect(message.to).toEqual([{ name: '', address: TO }]);
    expect(message.subject).toMatch(subject);
    expect(message.text).toContain('012345');
    expect(message.html).toContain('012345');
  });

  it('gives each purpose its own wording', async () => {
    const { mailer, sent } = jsonMailer();
    await mailer.sendVerificationCode({ to: TO, code: '111111', purpose: 'email_verification' });
    await mailer.sendVerificationCode({ to: TO, code: '222222', purpose: 'password_reset' });
    expect(sent[0].subject).not.toBe(sent[1].subject);
    expect(sent[0].text).not.toBe(sent[1].text);
  });

  it.each(['12345', '1234567', 'abcdef', 123456, undefined])(
    'refuses code %p without sending',
    async (code) => {
      const { mailer, sent } = jsonMailer();
      await expect(mailer.sendVerificationCode({ to: TO, code, purpose: 'password_reset' })).rejects.toThrow(
        /6-digit/,
      );
      expect(sent).toHaveLength(0);
    },
  );

  it('refuses an unknown purpose without sending', async () => {
    const { mailer, sent } = jsonMailer();
    await expect(
      mailer.sendVerificationCode({ to: TO, code: '012345', purpose: 'email_change' }),
    ).rejects.toThrow(/Unknown verification code purpose/);
    expect(sent).toHaveLength(0);
  });

  it.each(['', undefined, 'a@example.com, b@example.com', 'a@example.com\r\nBcc: b@example.com'])(
    'refuses recipient %p without sending',
    async (to) => {
      const { mailer, sent } = jsonMailer();
      await expect(
        mailer.sendVerificationCode({ to, code: '012345', purpose: 'password_reset' }),
      ).rejects.toThrow(/single email address/);
      expect(sent).toHaveLength(0);
    },
  );

  it('replaces a transport failure with an error that carries no address, code or credential', async () => {
    const failure = Object.assign(
      new Error(`Recipient ${TO} rejected for code 012345 (user mailer@example.com)`),
      {
        code: 'EENVELOPE',
        responseCode: 550,
      },
    );
    const mailer = createMailer({ transport: { sendMail: () => Promise.reject(failure) }, from: FROM });

    const error = await mailer
      .sendVerificationCode({ to: TO, code: '012345', purpose: 'email_verification' })
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Failed to send the verification code email');
    expect(error.code).toBe('EENVELOPE');
    expect(error.responseCode).toBe(550);
    expect(error.cause).toBeUndefined();
    const everything = JSON.stringify({ ...error, message: error.message, stack: error.stack });
    expect(everything).not.toContain(TO);
    expect(everything).not.toContain('012345');
    expect(everything).not.toContain('mailer@example.com');
  });
});

describe('smtpMailer (the createApp default)', () => {
  it('refuses to send when NODE_ENV=test, so no test can open an SMTP connection', async () => {
    await expect(
      smtpMailer.sendVerificationCode({ to: TO, code: '012345', purpose: 'email_verification' }),
    ).rejects.toThrow(/disabled when NODE_ENV=test/);
  });
});

describe('VERIFICATION_PURPOSES', () => {
  it('matches the verification_codes.purpose ENUM in the migration', () => {
    const migration = readFileSync(
      path.join(process.cwd(), 'src/migrations/20261028183255-create-auth-tables.cjs'),
      'utf8',
    );
    const match = /purpose: \{ type: Sequelize\.ENUM\(([^)]*)\)/.exec(migration);
    const values = match[1].split(',').map((value) => value.trim().replace(/'/g, ''));
    expect([...VERIFICATION_PURPOSES]).toEqual(values);
  });
});
