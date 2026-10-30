import { AMENITY_BILLING_CYCLES, LIMITS } from '@real-estate/shared';
import { DataTypes } from 'sequelize';

const P = LIMITS.property;

// One price plan of an amenity ("Basic", per month). The service requires at least one plan per amenity.
export function definePropertyAmenityPlan(sequelize) {
  const PropertyAmenityPlan = sequelize.define(
    'PropertyAmenityPlan',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      propertyAmenityId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      planName: { type: DataTypes.STRING(P.planName.max), allowNull: false },
      billingCycle: { type: DataTypes.ENUM(...AMENITY_BILLING_CYCLES), allowNull: false },
      price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      features: { type: DataTypes.STRING(P.planFeatures.max), allowNull: true },
    },
    { tableName: 'property_amenity_plans', underscored: true },
  );

  PropertyAmenityPlan.associate = (models) => {
    PropertyAmenityPlan.belongsTo(models.PropertyAmenity, { foreignKey: 'propertyAmenityId', as: 'amenity' });
  };

  return PropertyAmenityPlan;
}
