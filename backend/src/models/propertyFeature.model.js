import { LIMITS } from '@real-estate/shared';
import { DataTypes } from 'sequelize';

// One "Amenities & Features" item of a listing, unique per property; not a bookable amenity (PROP-DEC-006).
export function definePropertyFeature(sequelize) {
  const PropertyFeature = sequelize.define(
    'PropertyFeature',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      propertyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(LIMITS.property.featureName.max), allowNull: false },
    },
    { tableName: 'property_features', underscored: true },
  );

  PropertyFeature.associate = (models) => {
    PropertyFeature.belongsTo(models.Property, { foreignKey: 'propertyId', as: 'property' });
  };

  return PropertyFeature;
}
