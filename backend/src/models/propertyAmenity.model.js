import { AMENITY_CATEGORIES, AMENITY_PRICING_TYPES, AMENITY_STATUSES, LIMITS } from '@real-estate/shared';
import { DataTypes } from 'sequelize';

const P = LIMITS.property;

// A bookable amenity of a property, priced by one or more plans (PROP-DEC-006). Delete is permanent.
export function definePropertyAmenity(sequelize) {
  const PropertyAmenity = sequelize.define(
    'PropertyAmenity',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      propertyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(P.amenityName.max), allowNull: false },
      category: { type: DataTypes.ENUM(...AMENITY_CATEGORIES), allowNull: false },
      pricingType: { type: DataTypes.ENUM(...AMENITY_PRICING_TYPES), allowNull: false },
      description: { type: DataTypes.STRING(P.amenityDescription.max), allowNull: false },
      features: { type: DataTypes.STRING(P.amenityFeatures.max), allowNull: false },
      status: { type: DataTypes.ENUM(...AMENITY_STATUSES), allowNull: false, defaultValue: 'active' },
    },
    { tableName: 'property_amenities', underscored: true },
  );

  PropertyAmenity.associate = (models) => {
    PropertyAmenity.belongsTo(models.Property, { foreignKey: 'propertyId', as: 'property' });
    PropertyAmenity.hasMany(models.PropertyAmenityPlan, { foreignKey: 'propertyAmenityId', as: 'plans' });
  };

  return PropertyAmenity;
}
