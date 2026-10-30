import { LIMITS, PROPERTY_MEDIA_MIME_TYPES, PROPERTY_MEDIA_TYPES } from '@real-estate/shared';
import { DataTypes } from 'sequelize';

// One gallery image, video or 360 tour, in display order; the first image is the cover (PROP-DEC-009).
// Videos need 'video' in pending_file_deletions first (PROP-Q-011, integration owner follow-up).
export function definePropertyMedia(sequelize) {
  const PropertyMedia = sequelize.define(
    'PropertyMedia',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      propertyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      mediaType: { type: DataTypes.ENUM(...PROPERTY_MEDIA_TYPES), allowNull: false },
      cloudinaryPublicId: { type: DataTypes.STRING(255), allowNull: false },
      cloudinaryResourceType: { type: DataTypes.ENUM('image', 'video'), allowNull: false },
      originalFilename: { type: DataTypes.STRING(LIMITS.property.fileName.max), allowNull: false },
      mimeType: { type: DataTypes.ENUM(...PROPERTY_MEDIA_MIME_TYPES), allowNull: false },
      sizeBytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      sortOrder: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'property_media', underscored: true },
  );

  PropertyMedia.associate = (models) => {
    PropertyMedia.belongsTo(models.Property, { foreignKey: 'propertyId', as: 'property' });
  };

  return PropertyMedia;
}
