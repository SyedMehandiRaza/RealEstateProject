import { DataTypes } from 'sequelize';

// Developer business details (agent deferred, DEC-017).
export function defineProfessionalProfile(sequelize) {
  const ProfessionalProfile = sequelize.define(
    'ProfessionalProfile',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      organizationName: { type: DataTypes.STRING(150), allowNull: true },
      businessType: { type: DataTypes.ENUM('individual', 'company'), allowNull: false },
      licenseNumber: { type: DataTypes.STRING(50), allowNull: false },
      experienceLevel: { type: DataTypes.ENUM('0_2', '3_5', '6_10', '10_plus'), allowNull: false },
      location: { type: DataTypes.STRING(150), allowNull: false },
    },
    { tableName: 'professional_profiles', underscored: true },
  );

  ProfessionalProfile.associate = (models) => {
    ProfessionalProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    ProfessionalProfile.hasMany(models.VerificationDocument, {
      foreignKey: 'professionalProfileId',
      as: 'documents',
    });
  };

  return ProfessionalProfile;
}
