// Data access of the property module (PROP-SPEC-001). Every read of a property is scoped to its owner.
export function createPropertyRepository(models) {
  return {
    // The caller's property with this id, or null (also for another owner's property).
    findOwned(id, ownerId, { transaction, lock } = {}) {
      return models.Property.findOne({ where: { id, ownerId }, transaction, lock });
    },
  };
}
