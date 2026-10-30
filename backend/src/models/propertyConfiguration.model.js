import { CONFIGURATION_STATUSES, LIMITS } from '@real-estate/shared';
import { DataTypes } from 'sequelize';

// A unit type of a property ("2 BHK Apartment"), unique by name inside the property (PROP-DEC-007).
export function definePropertyConfiguration(sequelize) {
  const PropertyConfiguration = sequelize.define(
    'PropertyConfiguration',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      propertyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(LIMITS.property.configurationName.max), allowNull: false },
      areaSqft: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      totalUnits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      availableUnits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      status: {
        type: DataTypes.ENUM(...CONFIGURATION_STATUSES),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    { tableName: 'property_configurations', underscored: true },
  );

  PropertyConfiguration.associate = (models) => {
    PropertyConfiguration.belongsTo(models.Property, { foreignKey: 'propertyId', as: 'property' });
    PropertyConfiguration.hasMany(models.PropertyConfigurationFloorPlan, {
      foreignKey: 'propertyConfigurationId',
      as: 'floorPlans',
    });
  };

  return PropertyConfiguration;
}
