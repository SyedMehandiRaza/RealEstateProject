import { literal } from 'sequelize';

// Sequelize queries for Accounts. Roles always come in the same query as the Account (no N+1). For a
// Developer only, a second query loads what user.developerVerificationStatus is derived from: the
// professional profile and, of its document history, only the latest row of each kind (TASK-048).
// A non-Developer's reads stay one SELECT.

// Latest of its kind: no row of the same profile and kind is newer by created_at, then id (the order
// verificationStatus uses; DATETIME keeps whole seconds, so two rows can share a time). Served by
// idx_verification_documents_profile_kind_created_at. `documents` is the include's alias.
const LATEST_OF_ITS_KIND = literal(`NOT EXISTS (
  SELECT 1 FROM verification_documents AS newer
  WHERE newer.professional_profile_id = documents.professional_profile_id
    AND newer.document_kind = documents.document_kind
    AND (newer.created_at > documents.created_at
      OR (newer.created_at = documents.created_at AND newer.id > documents.id)))`);

export function createAuthRepository(models) {
  const { User, UserRole, ProfessionalProfile, VerificationDocument } = models;
  const withRoles = { model: UserRole, as: 'roles', attributes: ['role'] };

  // Sets user.professionalProfile (null without Professional info) for a Developer, as toUserResponse
  // needs it; leaves any other Account (and null) as it is. Runs in the caller's transaction.
  async function withDeveloperVerification(user, transaction) {
    if (!user?.roles.some((userRole) => userRole.role === 'developer')) return user;
    user.professionalProfile = await ProfessionalProfile.findOne({
      where: { userId: user.id },
      attributes: ['id', 'businessType'],
      include: [
        {
          model: VerificationDocument,
          as: 'documents',
          attributes: ['id', 'documentKind', 'status', 'createdAt'],
          where: LATEST_OF_ITS_KIND,
          required: false,
        },
      ],
      transaction,
    });
    return user;
  }

  return {
    // `email` must already be normalized (trimmed, lowercase) by the shared schema.
    async findUserByEmail(email, { transaction } = {}) {
      const user = await User.findOne({ where: { email }, include: [withRoles], transaction });
      return withDeveloperVerification(user, transaction);
    },

    // Log in only: the Account with its password hash and its roles, in one query (two for a Developer).
    async findUserForLogin(email) {
      const user = await User.scope('withPassword').findOne({ where: { email }, include: [withRoles] });
      return withDeveloperVerification(user);
    },

    // Password reset only: the Account with its password hash, which the reset token is bound to.
    findUserWithPasswordByEmail(email, { transaction } = {}) {
      return User.scope('withPassword').findOne({ where: { email }, transaction });
    },

    // Password reset only: the Account with its password hash, locked FOR UPDATE until the transaction
    // ends, so two resets with one token run in turn and the second sees the new hash.
    lockUserWithPasswordById(id, { transaction }) {
      return User.scope('withPassword').findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    },

    async findUserById(id, { transaction } = {}) {
      const user = await User.findByPk(id, { include: [withRoles], transaction });
      return withDeveloperVerification(user, transaction);
    },

    // The Account row only (no roles), locked FOR UPDATE until the transaction ends.
    lockUserById(id, { transaction }) {
      return User.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    },

    // Adds a role to an Account. Throws Sequelize's UniqueConstraintError if the Account already has it
    // (uq_user_roles_user_id_role).
    addRole(userId, role, { transaction }) {
      return UserRole.create({ userId, role }, { transaction });
    },

    // The Account row only, locked FOR UPDATE until the transaction ends, so concurrent requests for
    // one Account (such as two resends) run one after the other.
    lockUserByEmail(email, { transaction }) {
      return User.findOne({ where: { email }, transaction, lock: transaction.LOCK.UPDATE });
    },

    // Creates the Account and its first role. Throws Sequelize's UniqueConstraintError for a taken email.
    async createUser({ fullName, email, phone, passwordHash, role }, { transaction }) {
      const user = await User.create({ fullName, email, phone, passwordHash }, { transaction });
      await UserRole.create({ userId: user.id, role }, { transaction });
      return user;
    },
  };
}
