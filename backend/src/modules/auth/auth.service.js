import { authMessages } from '@real-estate/shared';
import { UniqueConstraintError } from 'sequelize';
import { AppError } from '../../utils/AppError.js';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from '../../utils/password.js';
import { toUserResponse } from './auth.presenter.js';
import { SESSION_CHECK } from './session.service.js';
import { CODE_CHECK, CODE_PURPOSES, ResendRefusedError } from './verificationCode.service.js';

// Every failed login answers the same, whether the password was wrong, the email unknown or the limit hit.
const invalidCredentials = () =>
  new AppError('UNAUTHORIZED', { message: authMessages.api.invalidCredentials });

// Every refused reset token (invalid, expired, used, or its Account gone) answers the same (SPEC-001).
const resetTokenRefused = () => new AppError('UNAUTHORIZED', { message: authMessages.resetToken.required });

const CODE_ERRORS = {
  [CODE_CHECK.invalid]: authMessages.api.codeInvalid,
  [CODE_CHECK.tooManyAttempts]: authMessages.api.codeTooManyAttempts,
};

// The auth use cases (SPEC-001). Input is already validated and normalized by the shared schemas; each
// method returns plain data or throws an AppError with a shared code.
export function createAuthService({
  sequelize,
  repository,
  verificationCodes,
  sessions,
  loginAttempts,
  resetTokens,
  mailer,
  clock,
  logger,
}) {
  // Mail goes out after the commit and never inside a transaction. If it fails, the Account and code
  // stay and the caller answers as on success, so the user can press Resend (Q-037). The log names the
  // Account id only: never the address or the code.
  async function mailCode({ userId, email, code, purpose }) {
    try {
      await mailer.sendVerificationCode({ to: email, code, purpose });
    } catch (err) {
      logger.error({ err, userId, purpose }, 'Could not send a verification code email');
    }
  }

  // Mails a new code when the resend rules allow and silently skips the email when they refuse
  // (ResendRefusedError: cooldown or hourly cap; the previous code still works). The Account row is
  // locked first, as for a resend, so concurrent requests cannot both pass the cooldown (DEC-026).
  async function sendCodeIfAllowed({ userId, email, purpose }) {
    let code;
    try {
      code = await sequelize.transaction(async (transaction) => {
        // Null if the Account was deleted since it was read: nothing to send.
        if (!(await repository.lockUserByEmail(email, { transaction }))) return null;
        return verificationCodes.issue({ userId, purpose }, { transaction });
      });
    } catch (error) {
      if (error instanceof ResendRefusedError) return;
      throw error;
    }
    if (code) await mailCode({ userId, email, code, purpose });
  }

  // Issues a code for the Account of `email` within the resend rules (ResendRefusedError → 429) and
  // mails it. The Account row is locked first, so concurrent requests cannot both pass the cooldown
  // (DEC-026). Unknown emails, and Accounts that `eligible` refuses, get no code and no email and the
  // same { sent: true }, so this does not reveal which Accounts exist.
  async function resendCode({ email, purpose, eligible = () => true }) {
    const issued = await sequelize.transaction(async (transaction) => {
      const user = await repository.lockUserByEmail(email, { transaction });
      if (!user || !eligible(user)) return null;
      const code = await verificationCodes.issue({ userId: user.id, purpose }, { transaction });
      return { userId: user.id, code };
    });
    if (issued) await mailCode({ ...issued, email, purpose });
    return { sent: true };
  }

  return {
    // Creates the Account, its first role and its first email_verification code in one transaction,
    // then mails the code. An email that already has an Account is refused, whatever the role.
    async signUp({ role, fullName, email, phone, password }) {
      const passwordHash = await hashPassword(password);
      const purpose = CODE_PURPOSES.emailVerification;

      let created;
      try {
        created = await sequelize.transaction(async (transaction) => {
          const user = await repository.createUser(
            { fullName, email, phone, passwordHash, role },
            { transaction },
          );
          const code = await verificationCodes.issue({ userId: user.id, purpose }, { transaction });
          return { userId: user.id, code };
        });
      } catch (error) {
        if (error instanceof UniqueConstraintError) {
          throw new AppError('CONFLICT', { fields: { email: [authMessages.api.emailTaken] } });
        }
        throw error;
      }

      await mailCode({ ...created, email, purpose });
      return { email };
    },

    // Accepts the newest email_verification code, marks the email verified and starts a session. An
    // unknown email gets the same answer as a wrong code, so this does not reveal which Accounts exist.
    async verifyEmail({ email, code }) {
      // A wrong guess is stored even though the request fails, so the outcome leaves the transaction
      // as a value and the error is thrown after the commit.
      const outcome = await sequelize.transaction(async (transaction) => {
        const user = await repository.findUserByEmail(email, { transaction });
        if (!user) return { result: CODE_CHECK.invalid };

        const result = await verificationCodes.check(
          { userId: user.id, purpose: CODE_PURPOSES.emailVerification, code },
          { transaction },
        );
        if (result !== CODE_CHECK.valid) return { result };

        if (!user.emailVerifiedAt) await user.update({ emailVerifiedAt: clock.now() }, { transaction });
        const userResponse = toUserResponse(user);
        const session = await sessions.start({ userId: user.id, roles: userResponse.roles }, { transaction });
        return { result, user: userResponse, session };
      });

      if (outcome.result !== CODE_CHECK.valid) {
        throw new AppError('VALIDATION_ERROR', { fields: { code: [CODE_ERRORS[outcome.result]] } });
      }
      return { user: outcome.user, ...outcome.session };
    },

    // Sends a new email_verification code within the resend rules (ResendRefusedError → 429). Unknown
    // and already-verified emails get the same answer and no email, so this does not reveal Accounts.
    resendVerification({ email }) {
      return resendCode({
        email,
        purpose: CODE_PURPOSES.emailVerification,
        eligible: (user) => !user.emailVerifiedAt,
      });
    },

    // Log in by email (SPEC-001 login flow order). Wrong password, unknown email and a hit per-account
    // limit all answer 401 invalidCredentials. The right password on an unverified email answers 403
    // EMAIL_NOT_VERIFIED and mails a new code if the resend rules allow; otherwise a session starts.
    async login({ email, password }) {
      if (!loginAttempts.tryAttempt(email)) throw invalidCredentials();

      const user = await repository.findUserForLogin(email);
      // An unknown email is compared with a dummy hash, so it takes as long as a wrong password.
      const passwordMatches = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
      if (!user || !passwordMatches) throw invalidCredentials();
      loginAttempts.succeeded(email);

      if (!user.emailVerifiedAt) {
        await sendCodeIfAllowed({ userId: user.id, email, purpose: CODE_PURPOSES.emailVerification });
        throw new AppError('EMAIL_NOT_VERIFIED');
      }

      const userResponse = toUserResponse(user);
      const session = await sessions.start({ userId: user.id, roles: userResponse.roles });
      return { user: userResponse, ...session };
    },

    // Rotates the refresh token: the presented one is revoked and a new session starts with the
    // Account's current roles. Missing, unknown, expired or revoked → 401 UNAUTHORIZED; a revoked one is
    // a reuse, which revokes every session of the Account before the 401 (committed first).
    async refresh({ refreshToken }) {
      const outcome = await sequelize.transaction(async (transaction) => {
        const check = await sessions.consume(refreshToken, { transaction });
        if (check.result !== SESSION_CHECK.valid) return null;

        const user = await repository.findUserById(check.userId, { transaction });
        if (!user) return null;
        const userResponse = toUserResponse(user);
        const session = await sessions.start({ userId: user.id, roles: userResponse.roles }, { transaction });
        return { user: userResponse, ...session };
      });

      if (!outcome) throw new AppError('UNAUTHORIZED');
      return outcome;
    },

    // Ends the session of the presented refresh token, if any. Always succeeds.
    async logout({ refreshToken }) {
      await sessions.end(refreshToken);
    },

    // Forgot Password and its Resend (SPEC-001): mail a password_reset code within the resend rules.
    // Unknown emails get the same { sent: true } and no email. An Account that never verified its email
    // gets a code too, or it could never recover a forgotten password (Q-039).
    requestPasswordReset({ email }) {
      return resendCode({ email, purpose: CODE_PURPOSES.passwordReset });
    },

    // Accepts the newest password_reset code and returns a reset token (10 min) bound to the Account's
    // current password hash. Wrong, expired, used or dead codes and unknown emails answer as on
    // verify-email. No session starts and the email is not marked verified; resetPassword uses the token.
    async verifyPasswordReset({ email, code }) {
      // A wrong guess is stored even though the request fails: the outcome leaves the transaction as a
      // value and the error is thrown after the commit.
      const outcome = await sequelize.transaction(async (transaction) => {
        const user = await repository.findUserWithPasswordByEmail(email, { transaction });
        if (!user) return { result: CODE_CHECK.invalid };
        const result = await verificationCodes.check(
          { userId: user.id, purpose: CODE_PURPOSES.passwordReset, code },
          { transaction },
        );
        return { result, user };
      });

      if (outcome.result !== CODE_CHECK.valid) {
        throw new AppError('VALIDATION_ERROR', { fields: { code: [CODE_ERRORS[outcome.result]] } });
      }
      const { id: userId, passwordHash } = outcome.user;
      return { resetToken: resetTokens.issue({ userId, passwordHash }) };
    },

    // Sets a new password with a reset token and revokes every refresh token of the Account, so every
    // device is logged out. The token is bound to the password hash it was issued for, so once the hash
    // changes it is refused: single-use. The Account row is locked while the hash is checked and
    // replaced, so two resets with one token cannot both pass. Access tokens already issued stay valid
    // until they expire (they are not stored). Refused tokens → 401 with resetToken.required.
    async resetPassword({ resetToken, password }) {
      const claims = resetTokens.read(resetToken);
      if (!claims) throw resetTokenRefused();
      // Hashed before the transaction, so the row lock is not held during bcrypt.
      const passwordHash = await hashPassword(password);

      const changed = await sequelize.transaction(async (transaction) => {
        const user = await repository.lockUserWithPasswordById(claims.userId, { transaction });
        if (!user || !resetTokens.matchesPassword(claims, user.passwordHash)) return false;
        await user.update({ passwordHash }, { transaction });
        await sessions.revokeAll(user.id, { transaction });
        return true;
      });

      if (!changed) throw resetTokenRefused();
      return { message: authMessages.api.passwordChanged };
    },

    // The signed-in Account. One deleted since its access token was issued is no longer signed in.
    async me({ userId }) {
      const user = await repository.findUserById(userId);
      if (!user) throw new AppError('UNAUTHORIZED');
      return { user: toUserResponse(user) };
    },
  };
}
