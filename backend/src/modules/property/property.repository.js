// Data access of the property module (PROP-SPEC-001). Every read of a property is scoped to its owner,
// except findDetail, which the service calls only with an id it already checked.

// The file columns of a row, from an upload ({ publicId, resourceType, fileName, mimeType, sizeBytes }).
const fileColumns = (upload) => ({
  cloudinaryPublicId: upload.publicId,
  cloudinaryResourceType: upload.resourceType,
  originalFilename: upload.fileName,
  mimeType: upload.mimeType,
  sizeBytes: upload.sizeBytes,
});

export function createPropertyRepository(models) {
  return {
    // The caller's property with this id, or null (also for another owner's property).
    findOwned(id, ownerId, { transaction, lock } = {}) {
      return models.Property.findOne({ where: { id, ownerId }, transaction, lock });
    },

    // The property with what the detail shape needs: features, configurations in created order, images in
    // gallery order (the first is the cover) and the progress row.
    findDetail(id, { transaction } = {}) {
      return models.Property.findByPk(id, {
        transaction,
        include: [
          { model: models.PropertyFeature, as: 'features', attributes: ['id', 'name'] },
          {
            model: models.PropertyConfiguration,
            as: 'configurations',
            attributes: ['id', 'name', 'price', 'status', 'createdAt'],
          },
          { model: models.PropertyMedia, as: 'media', where: { mediaType: 'image' }, required: false },
          { model: models.PropertyConstructionProgress, as: 'constructionProgress' },
        ],
        order: [
          [{ model: models.PropertyFeature, as: 'features' }, 'id', 'ASC'],
          [{ model: models.PropertyConfiguration, as: 'configurations' }, 'createdAt', 'ASC'],
          [{ model: models.PropertyConfiguration, as: 'configurations' }, 'id', 'ASC'],
          [{ model: models.PropertyMedia, as: 'media' }, 'sortOrder', 'ASC'],
          [{ model: models.PropertyMedia, as: 'media' }, 'id', 'ASC'],
        ],
      });
    },

    // Writes a whole property inside `transaction` (Add Property Submit). Files are uploads read from their
    // tokens. media: { image: [upload], video: [...], tour_360: [...] }, sort order = position.
    // documents: [{ documentType, upload }]. progress: { possessionDate } or null. Returns the property row.
    async createGraph(
      { ownerId, fields, features, configurations, media, documents, progress },
      { transaction },
    ) {
      const property = await models.Property.create({ ...fields, ownerId }, { transaction });
      const propertyId = property.id;
      await models.PropertyFeature.bulkCreate(
        features.map((name) => ({ propertyId, name })),
        { transaction },
      );
      for (const { floorPlans, ...configuration } of configurations) {
        const row = await models.PropertyConfiguration.create(
          { ...configuration, propertyId },
          { transaction },
        );
        await models.PropertyConfigurationFloorPlan.bulkCreate(
          floorPlans.map((upload) => ({ propertyConfigurationId: row.id, ...fileColumns(upload) })),
          { transaction },
        );
      }
      await models.PropertyMedia.bulkCreate(
        Object.entries(media).flatMap(([mediaType, uploads]) =>
          uploads.map((upload, sortOrder) => ({ propertyId, mediaType, sortOrder, ...fileColumns(upload) })),
        ),
        { transaction },
      );
      await models.PropertyDocument.bulkCreate(
        documents.map(({ documentType, upload }) => ({
          propertyId,
          documentType,
          status: 'uploaded',
          ...fileColumns(upload),
        })),
        { transaction },
      );
      if (progress) {
        await models.PropertyConstructionProgress.create({ propertyId, ...progress }, { transaction });
      }
      return property;
    },
  };
}
