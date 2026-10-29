import { authMessages } from '@real-estate/shared';
import { UniqueConstraintError } from 'sequelize';
import { AppError } from '../../utils/AppError.js';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from '../../utils/password.js';
import { toUserResponse } from './auth.presenter.js';
import { CODE_CHECK, CODE_PURPOSES, ResendRefusedError } from './verificationCode.service.js';

// Every failed login answers the same, whether the password was wrong, the email unknown or the limit hit.
const invalidCredentials = () =>
  new AppError('UNAUTHORIZED', { message: authMessages.api.invalidCredentials });

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
    async resendVerification({ email }) {
      const purpose = CODE_PURPOSES.emailVerification;
      const issued = await sequelize.transaction(async (transaction) => {
        const user = await repository.lockUserByEmail(email, { transaction });
        if (!user || user.emailVerifiedAt) return null;
        const code = await verificationCodes.issue({ userId: user.id, purpose }, { transaction });
        return { userId: user.id, code };
      });

      if (issued) await mailCode({ ...issued, email, purpose });
      return { sent: true };
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

    // The signed-in Account. One deleted since its access token was issued is no longer signed in.
    async me({ userId }) {
      const user = await repository.findUserById(userId);
      if (!user) throw new AppError('UNAUTHORIZED');
      return { user: toUserResponse(user) };
    },
  };
}
