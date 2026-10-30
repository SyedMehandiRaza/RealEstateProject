import {
  AREA_UNITS,
  LISTING_CATEGORIES,
  LISTING_PURPOSES,
  LIMITS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from '@real-estate/shared';
import { DataTypes } from 'sequelize';

const P = LIMITS.property;

// Matches migration 20261030212741-create-property-tables.cjs. A listing owned by a Developer account
// (PROP-DEC-001); property-owned rows are deleted with it by FK CASCADE (PROP-DEC-002).
export function defineProperty(sequelize) {
  const Property = sequelize.define(
    'Property',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      ownerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(P.name.max), allowNull: false },
      propertyType: { type: DataTypes.ENUM(...PROPERTY_TYPES), allowNull: false },
      listingPurpose: { type: DataTypes.ENUM(...LISTING_PURPOSES), allowNull: false },
      listingCategory: { type: DataTypes.ENUM(...LISTING_CATEGORIES), allowNull: false },
      propertyStatus: { type: DataTypes.ENUM(...PROPERTY_STATUSES), allowNull: false },
      countryCode: { type: DataTypes.CHAR(2), allowNull: false },
      state: { type: DataTypes.STRING(P.state.max), allowNull: false },
      city: { type: DataTypes.STRING(P.city.max), allowNull: false },
      locality: { type: DataTypes.STRING(P.locality.max), allowNull: false },
      postalCode: { type: DataTypes.STRING(P.postalCode.max), allowNull: false },
      address: { type: DataTypes.STRING(P.address.max), allowNull: false },
      latitude: { type: DataTypes.DECIMAL(8, 6), allowNull: false },
      longitude: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
      totalArea: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      totalAreaUnit: { type: DataTypes.ENUM(...AREA_UNITS), allowNull: false },
      totalUnits: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      towerCount: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      floorCount: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      startingPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      yearBuilt: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      builderName: { type: DataTypes.STRING(P.builderName.max), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
    },
    { tableName: 'properties', underscored: true },
  );

  Property.associate = (models) => {
    Property.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
    models.User.hasMany(Property, { foreignKey: 'ownerId', as: 'properties' });
    Property.hasMany(models.PropertyConfiguration, { foreignKey: 'propertyId', as: 'configurations' });
    Property.hasMany(models.PropertyMedia, { foreignKey: 'propertyId', as: 'media' });
    Property.hasMany(models.PropertyDocument, { foreignKey: 'propertyId', as: 'documents' });
    Property.hasMany(models.PropertyFeature, { foreignKey: 'propertyId', as: 'features' });
    Property.hasOne(models.PropertyConstructionProgress, {
      foreignKey: 'propertyId',
      as: 'constructionProgress',
    });
    Property.hasMany(models.PropertyUpdate, { foreignKey: 'propertyId', as: 'updates' });
    Property.hasMany(models.PropertyAmenity, { foreignKey: 'propertyId', as: 'amenities' });
    // Staff side (staff module): who is assigned to this property.
    Property.hasMany(models.StaffPropertyAssignment, { foreignKey: 'propertyId', as: 'staffAssignments' });
    Property.belongsToMany(models.StaffMember, {
      through: models.StaffPropertyAssignment,
      foreignKey: 'propertyId',
      otherKey: 'staffMemberId',
      as: 'staffMembers',
    });
  };

  return Property;
}
