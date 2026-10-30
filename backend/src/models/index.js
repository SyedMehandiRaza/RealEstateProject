import { Sequelize } from 'sequelize';
import databaseConfig from '../config/database.cjs';
import { env } from '../config/env.js';
import { definePendingFileDeletion } from './pendingFileDeletion.model.js';
import { defineProfessionalProfile } from './professionalProfile.model.js';
import { defineProperty } from './property.model.js';
import { definePropertyAmenity } from './propertyAmenity.model.js';
import { definePropertyAmenityPlan } from './propertyAmenityPlan.model.js';
import { definePropertyConfiguration } from './propertyConfiguration.model.js';
import { definePropertyConfigurationFloorPlan } from './propertyConfigurationFloorPlan.model.js';
import { definePropertyConstructionProgress } from './propertyConstructionProgress.model.js';
import { definePropertyDocument } from './propertyDocument.model.js';
import { definePropertyFeature } from './propertyFeature.model.js';
import { definePropertyMedia } from './propertyMedia.model.js';
import { definePropertyUpdate } from './propertyUpdate.model.js';
import { defineRefreshToken } from './refreshToken.model.js';
import { defineStaffMember } from './staffMember.model.js';
import { defineStaffMemberPermission } from './staffMemberPermission.model.js';
import { defineStaffPropertyAssignment } from './staffPropertyAssignment.model.js';
import { defineUser } from './user.model.js';
import { defineUserRole } from './userRole.model.js';
import { defineVerificationCode } from './verificationCode.model.js';
import { defineVerificationDocument } from './verificationDocument.model.js';

const config = databaseConfig[env.NODE_ENV];

export const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Register models explicitly: import each `define<Model>(sequelize)` here and add it to `models`.
const models = {
  User: defineUser(sequelize),
  UserRole: defineUserRole(sequelize),
  RefreshToken: defineRefreshToken(sequelize),
  VerificationCode: defineVerificationCode(sequelize),
  ProfessionalProfile: defineProfessionalProfile(sequelize),
  VerificationDocument: defineVerificationDocument(sequelize),
  PendingFileDeletion: definePendingFileDeletion(sequelize),
  // Property module (20261030212741-create-property-tables.cjs).
  Property: defineProperty(sequelize),
  PropertyConfiguration: definePropertyConfiguration(sequelize),
  PropertyConfigurationFloorPlan: definePropertyConfigurationFloorPlan(sequelize),
  PropertyMedia: definePropertyMedia(sequelize),
  PropertyDocument: definePropertyDocument(sequelize),
  PropertyFeature: definePropertyFeature(sequelize),
  PropertyConstructionProgress: definePropertyConstructionProgress(sequelize),
  PropertyUpdate: definePropertyUpdate(sequelize),
  PropertyAmenity: definePropertyAmenity(sequelize),
  PropertyAmenityPlan: definePropertyAmenityPlan(sequelize),
  // Staff module (20261030212742-create-staff-tables.cjs).
  StaffMember: defineStaffMember(sequelize),
  StaffMemberPermission: defineStaffMemberPermission(sequelize),
  StaffPropertyAssignment: defineStaffPropertyAssignment(sequelize),
};

for (const model of Object.values(models)) {
  model.associate?.(models);
}

export default models;
