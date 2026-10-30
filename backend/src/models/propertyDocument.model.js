import {
  LIMITS,
  PROPERTY_DOCUMENT_STATUSES,
  PROPERTY_DOCUMENT_TYPES,
  PROPERTY_FILE_MIME_TYPES,
} from '@real-estate/shared';
import { DataTypes } from 'sequelize';

// One property document (RERA, legal NOC, ...). Replace overwrites the file on the same row and resets the
// status to 'uploaded' (PROP-DEC-008).
export function definePropertyDocument(sequelize) {
  const PropertyDocument = sequelize.define(
    'PropertyDocument',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      propertyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      documentType: { type: DataTypes.ENUM(...PROPERTY_DOCUMENT_TYPES), allowNull: false },
      status: {
        type: DataTypes.ENUM(...PROPERTY_DOCUMENT_STATUSES),
        allowNull: false,
        defaultValue: 'uploaded',
      },
      cloudinaryPublicId: { type: DataTypes.STRING(255), allowNull: false },
      cloudinaryResourceType: { type: DataTypes.ENUM('image', 'raw'), allowNull: false },
      originalFilename: { type: DataTypes.STRING(LIMITS.property.fileName.max), allowNull: false },
      mimeType: { type: DataTypes.ENUM(...PROPERTY_FILE_MIME_TYPES), allowNull: false },
      sizeBytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    { tableName: 'property_documents', underscored: true },
  );

  PropertyDocument.associate = (models) => {
    PropertyDocument.belongsTo(models.Property, { foreignKey: 'propertyId', as: 'property' });
  };

  return PropertyDocument;
}
