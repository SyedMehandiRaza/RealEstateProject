import { Sequelize } from 'sequelize';
import databaseConfig from '../config/database.cjs';
import { env } from '../config/env.js';
import { definePendingFileDeletion } from './pendingFileDeletion.model.js';
import { defineProfessionalProfile } from './professionalProfile.model.js';
import { defineUser } from './user.model.js';
import { defineUserRole } from './userRole.model.js';
import { defineVerificationDocument } from './verificationDocument.model.js';

const config = databaseConfig[env.NODE_ENV];

export const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Register models explicitly: import each `define<Model>(sequelize)` here and add it to `models`.
// refresh_tokens and verification_codes get their models with the auth endpoints.
const models = {
  User: defineUser(sequelize),
  UserRole: defineUserRole(sequelize),
  ProfessionalProfile: defineProfessionalProfile(sequelize),
  VerificationDocument: defineVerificationDocument(sequelize),
  PendingFileDeletion: definePendingFileDeletion(sequelize),
};

for (const model of Object.values(models)) {
  model.associate?.(models);
}

export default models;
