import { LIMITS, PROPERTY_FILE_MIME_TYPES } from '@real-estate/shared';
import { DataTypes } from 'sequelize';

const P = LIMITS.property;

// A construction update with an optional file: the five file columns are all set or all NULL
// (chk_property_updates_file_all_or_none in the migration).
export function definePropertyUpdate(sequelize) {
  const PropertyUpdate = sequelize.define(
    'PropertyUpdate',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      propertyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      title: { type: DataTypes.STRING(P.updateTitle.max), allowNull: false },
      description: { type: DataTypes.STRING(P.updateDescription.max), allowNull: false },
      cloudinaryPublicId: { type: DataTypes.STRING(255), allowNull: true },
      cloudinaryResourceType: { type: DataTypes.ENUM('image', 'raw'), allowNull: true },
      originalFilename: { type: DataTypes.STRING(P.fileName.max), allowNull: true },
      mimeType: { type: DataTypes.ENUM(...PROPERTY_FILE_MIME_TYPES), allowNull: true },
      sizeBytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    { tableName: 'property_updates', underscored: true },
  );

  PropertyUpdate.associate = (models) => {
    PropertyUpdate.belongsTo(models.Property, { foreignKey: 'propertyId', as: 'property' });
  };

  return PropertyUpdate;
}
