import { authMessages } from '@real-estate/shared';
import { UniqueConstraintError } from 'sequelize';
import { AppError } from '../../utils/AppError.js';
import { hashPassword } from '../../utils/password.js';
import { toUserResponse } from './auth.presenter.js';
import { CODE_CHECK, CODE_PURPOSES } from './verificationCode.service.js';

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
  };
}
