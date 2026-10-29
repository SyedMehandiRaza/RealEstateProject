// Sequelize queries for Accounts. Roles always come in the same query as the Account (no N+1).
export function createAuthRepository(models) {
  const { User, UserRole } = models;
  const withRoles = { model: UserRole, as: 'roles', attributes: ['role'] };

  return {
    // `email` must already be normalized (trimmed, lowercase) by the shared schema.
    findUserByEmail(email, { transaction } = {}) {
      return User.findOne({ where: { email }, include: [withRoles], transaction });
    },

    // Log in only: the Account with its password hash and its roles, in one query.
    findUserForLogin(email) {
      return User.scope('withPassword').findOne({ where: { email }, include: [withRoles] });
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

    findUserById(id, { transaction } = {}) {
      return User.findByPk(id, { include: [withRoles], transaction });
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
