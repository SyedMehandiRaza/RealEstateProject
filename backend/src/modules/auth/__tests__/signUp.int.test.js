import { authMessages, ERROR_CODES } from '@real-estate/shared';
import { signUpCases } from '@real-estate/shared/testing';
import models from '../../../models/index.js';
import { createTestApp } from '../../../test/testApp.js';
import { signUp } from '../../../test/authFlows.js';
import { logger } from '../../../utils/logger.js';
import { verifyPassword } from '../../../utils/password.js';

const TEN_MINUTES = 10 * 60 * 1000;

describe('POST /api/auth/sign-up', () => {
  let app;
  let mailer;
  beforeEach(() => {
    ({ app, mailer } = createTestApp());
  });

  it('creates an unverified Buyer, stores the email lowercase and mails one email_verification code', async () => {
    const res = await signUp(app, { email: '  Sara@Example.COM ' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, data: { email: 'sara@example.com' } });

    expect(mailer.messages).toEqual([
      { to: 'sara@example.com', code: expect.stringMatching(/^\d{6}$/), purpose: 'email_verification' },
    ]);

    const user = await models.User.scope('withPassword').findOne({
      where: { email: 'sara@example.com' },
      include: ['roles'],
    });
    expect(user).toMatchObject({
      fullName: signUpCases.valid.fullName,
      phone: '+971501234567',
      emailVerifiedAt: null,
      preferredCountryCode: null,
    });
    expect(user.roles.map((userRole) => userRole.role)).toEqual(['buyer']);
    expect(user.passwordHash).not.toBe(signUpCases.valid.password);
    expect(await verifyPassword(signUpCases.valid.password, user.passwordHash)).toBe(true);
  });

  it('stores only the HMAC of the code, valid for 10 minutes', async () => {
    await signUp(app);
    const { code } = mailer.messages[0];

    const rows = await models.VerificationCode.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ purpose: 'email_verification', attempts: 0, usedAt: null });
    expect(rows[0].codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0].codeHash).not.toContain(code);
    expect(rows[0].expiresAt.getTime() - rows[0].createdAt.getTime()).toBe(TEN_MINUTES);
  });

  it('creates a Developer from the Developers tab', async () => {
    const res = await signUp(app, { role: 'developer', email: 'dev@example.com' });

    expect(res.status).toBe(201);
    const roles = await models.UserRole.findAll({ include: ['user'] });
    expect(roles.map((userRole) => [userRole.user.email, userRole.role])).toEqual([
      ['dev@example.com', 'developer'],
    ]);
  });

  it.each(['buyer', 'developer'])(
    'refuses an email that already has an Account (any case), signing up as %s',
    async (role) => {
      await signUp(app, { email: 'sara@example.com' });

      const res = await signUp(app, { role, email: 'SARA@example.com' });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'CONFLICT',
          message: ERROR_CODES.CONFLICT.message,
          fields: { email: [authMessages.api.emailTaken] },
        },
      });
      expect(await models.User.count()).toBe(1);
      expect(await models.UserRole.count()).toBe(1);
      expect(await models.VerificationCode.count()).toBe(1);
      expect(mailer.messages).toHaveLength(1);
    },
  );

  it('answers as on success when the email cannot be sent, and logs neither the address nor the code (Q-037)', async () => {
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => {});
    mailer.failNextSends(1);

    const res = await signUp(app, { email: 'sara@example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, data: { email: 'sara@example.com' } });
    expect(mailer.messages).toEqual([]);
    expect(await models.User.count()).toBe(1);
    expect(await models.VerificationCode.count()).toBe(1);

    expect(logError).toHaveBeenCalledTimes(1);
    const [fields, message] = logError.mock.calls[0];
    const user = await models.User.findOne();
    // Only these keys are logged; the mailer's error carries no address or code (DEC-024).
    expect(Object.keys(fields).sort()).toEqual(['err', 'purpose', 'userId']);
    expect(fields).toMatchObject({ userId: user.id, purpose: 'email_verification' });
    expect(fields.err.message).toBe('SMTP unavailable');
    expect(message).toBe('Could not send a verification code email');
    expect(JSON.stringify(logError.mock.calls[0])).not.toContain('sara@example.com');
    logError.mockRestore();
  });
});
