import { DataTypes } from 'sequelize';

// One uploaded file with its review status. The file itself is an authenticated Cloudinary asset (DEC-016).
export function defineVerificationDocument(sequelize) {
  const VerificationDocument = sequelize.define(
    'VerificationDocument',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      professionalProfileId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      documentKind: {
        type: DataTypes.ENUM('government_id', 'company_registration_certificate', 'profile_photo'),
        allowNull: false,
      },
      idDocumentType: { type: DataTypes.ENUM('driving_license', 'passport', 'pan_card'), allowNull: true },
      cloudinaryPublicId: { type: DataTypes.STRING(255), allowNull: false },
      cloudinaryResourceType: { type: DataTypes.ENUM('image', 'raw'), allowNull: false },
      originalFilename: { type: DataTypes.STRING(255), allowNull: false },
      mimeType: { type: DataTypes.ENUM('application/pdf', 'image/jpeg', 'image/png'), allowNull: false },
      sizeBytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejectionReason: { type: DataTypes.STRING(500), allowNull: true },
      reviewedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      reviewedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'verification_documents', underscored: true },
  );

  VerificationDocument.associate = (models) => {
    VerificationDocument.belongsTo(models.ProfessionalProfile, {
      foreignKey: 'professionalProfileId',
      as: 'professionalProfile',
    });
    VerificationDocument.belongsTo(models.User, { foreignKey: 'reviewedBy', as: 'reviewer' });
  };

  return VerificationDocument;
}
