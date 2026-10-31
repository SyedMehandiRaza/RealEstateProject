import { CONSTRUCTION_PHASES } from '@real-estate/shared';
import { presentFile } from '../files/fileDelivery.js';

// Response shapes of the property module (PROP-SPEC-001 "Endpoints", shapes). MySQL DECIMAL columns come
// back as strings; the API sends JSON numbers. Files carry 1-hour signed URLs and never a public id.

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));
const iso = (date) => (date ? new Date(date).toISOString() : null);

// PROP-DEC-010: 100 = complete, 1-99 = in progress, 0 = no badge.
export const phaseBadge = (percent) => {
  if (percent >= 100) return 'complete';
  return percent > 0 ? 'in_progress' : null;
};

// PROP-DEC-022: the price range of a property's Active configurations, null when it has none.
export function priceRange(configurations) {
  const prices = configurations.filter((c) => c.status === 'active').map((c) => Number(c.price));
  return prices.length === 0 ? null : { min: Math.min(...prices), max: Math.max(...prices) };
}

export function presentProgress(row) {
  const percents = Object.fromEntries(CONSTRUCTION_PHASES.map((phase) => [phase, row[`${phase}Percent`]]));
  return {
    overallPercent: row.overallPercent,
    foundationPercent: percents.foundation,
    structurePercent: percents.structure,
    interiorPercent: percents.interior,
    finishingPercent: percents.finishing,
    possessionDate: row.possessionDate ?? null,
    phases: CONSTRUCTION_PHASES.map((phase) => ({
      phase,
      percent: percents[phase],
      badge: phaseBadge(percents[phase]),
    })),
  };
}

// property: loaded with features, configurations, media (images, in gallery order) and constructionProgress
// (repository.findDetail). Progress is shown only while the property is under construction (PROP-DEC-015).
export function presentPropertyDetail(property, { storage, now }) {
  const underConstruction = property.propertyStatus === 'under_construction';
  const progress = underConstruction && property.constructionProgress ? property.constructionProgress : null;
  const [cover] = property.media ?? [];
  return {
    id: property.id,
    name: property.name,
    propertyType: property.propertyType,
    listingPurpose: property.listingPurpose,
    listingCategory: property.listingCategory,
    propertyStatus: property.propertyStatus,
    countryCode: property.countryCode,
    state: property.state,
    city: property.city,
    locality: property.locality,
    postalCode: property.postalCode,
    address: property.address,
    latitude: toNumber(property.latitude),
    longitude: toNumber(property.longitude),
    totalArea: toNumber(property.totalArea),
    totalAreaUnit: property.totalAreaUnit,
    totalUnits: property.totalUnits,
    towerCount: property.towerCount,
    floorCount: property.floorCount,
    startingPrice: toNumber(property.startingPrice),
    yearBuilt: property.yearBuilt,
    builderName: property.builderName,
    description: property.description,
    features: property.features.map((feature) => feature.name),
    possessionDate: progress?.possessionDate ?? null,
    configurationNames: property.configurations.map((configuration) => configuration.name),
    priceRange: priceRange(property.configurations),
    coverImage: cover ? presentFile(cover, { storage, now }) : null,
    progress: progress ? presentProgress(progress) : null,
    createdAt: iso(property.createdAt),
    updatedAt: iso(property.updatedAt),
  };
}
