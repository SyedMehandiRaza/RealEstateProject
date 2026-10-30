import { DataTypes } from 'sequelize';

// Construction progress of an under-construction property, one row per property (PROP-DEC-010).
// Overall is entered, phase badges are derived from the percentages.
export function definePropertyConstructionProgress(sequelize) {
  const percent = { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 };

  const PropertyConstructionProgress = sequelize.define(
    'PropertyConstructionProgress',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      propertyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      overallPercent: { ...percent },
      foundationPercent: { ...percent },
      structurePercent: { ...percent },
      interiorPercent: { ...percent },
      finishingPercent: { ...percent },
      possessionDate: { type: DataTypes.DATEONLY, allowNull: true },
    },
    { tableName: 'property_construction_progress', underscored: true },
  );

  PropertyConstructionProgress.associate = (models) => {
    PropertyConstructionProgress.belongsTo(models.Property, { foreignKey: 'propertyId', as: 'property' });
  };

  return PropertyConstructionProgress;
}
