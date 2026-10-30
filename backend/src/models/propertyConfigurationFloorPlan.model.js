import { LIMITS, PROPERTY_FILE_MIME_TYPES } from '@real-estate/shared';
import { DataTypes } from 'sequelize';

// One floor plan file of a configuration: an authenticated Cloudinary asset (DEC-016). The public id
// column is utf8mb4_bin in the migration (case-sensitive).
export function definePropertyConfigurationFloorPlan(sequelize) {
  const PropertyConfigurationFloorPlan = sequelize.define(
    'PropertyConfigurationFloorPlan',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      propertyConfigurationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      cloudinaryPublicId: { type: DataTypes.STRING(255), allowNull: false },
      cloudinaryResourceType: { type: DataTypes.ENUM('image', 'raw'), allowNull: false },
      originalFilename: { type: DataTypes.STRING(LIMITS.property.fileName.max), allowNull: false },
      mimeType: { type: DataTypes.ENUM(...PROPERTY_FILE_MIME_TYPES), allowNull: false },
      sizeBytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    { tableName: 'property_configuration_floor_plans', underscored: true },
  );

  PropertyConfigurationFloorPlan.associate = (models) => {
    PropertyConfigurationFloorPlan.belongsTo(models.PropertyConfiguration, {
      foreignKey: 'propertyConfigurationId',
      as: 'configuration',
    });
  };

  return PropertyConfigurationFloorPlan;
}
