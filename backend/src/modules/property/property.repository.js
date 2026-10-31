import { Op } from 'sequelize';

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

// LIKE pattern for "contains text": %, _ and the escape character match themselves.
const containsPattern = (text) => `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

const groupBy = (rows, key) => {
  const groups = new Map();
  for (const row of rows) groups.set(row[key], [...(groups.get(row[key]) ?? []), row]);
  return groups;
};

export function createPropertyRepository(models) {
  return {
    // My Properties (PROP-DEC-014): one page of the owner's properties, newest first, with what a card
    // needs, in four queries whatever the page size. Returns { total, properties: [{ property,
    // configurations, cover, progress }] }.
    async listOwned({ ownerId, page, pageSize, search }) {
      const where = { ownerId, ...(search && { name: { [Op.like]: containsPattern(search) } }) };
      const { count, rows } = await models.Property.findAndCountAll({
        where,
        order: [
          ['createdAt', 'DESC'],
          ['id', 'DESC'],
        ],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      const propertyId = rows.map((row) => row.id);
      const [configurations, images, progress] = await Promise.all([
        models.PropertyConfiguration.findAll({
          where: { propertyId },
          attributes: ['propertyId', 'price', 'status'],
        }),
        models.PropertyMedia.findAll({
          where: { propertyId, mediaType: 'image' },
          order: [
            ['sortOrder', 'ASC'],
            ['id', 'ASC'],
          ],
        }),
        models.PropertyConstructionProgress.findAll({ where: { propertyId } }),
      ]);
      const configurationsOf = groupBy(configurations, 'propertyId');
      const imagesOf = groupBy(images, 'propertyId');
      const progressOf = new Map(progress.map((row) => [row.propertyId, row]));
      return {
        total: count,
        properties: rows.map((property) => ({
          property,
          configurations: configurationsOf.get(property.id) ?? [],
          cover: imagesOf.get(property.id)?.[0] ?? null,
          progress: progressOf.get(property.id) ?? null,
        })),
      };
    },

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

    // Edit Property inside `transaction` (PROP-DEC-015): the columns, the features as a set, and, when
    // `possessionDate` is given (the property is under construction), the progress row: created at 0% if
    // missing, its possession date set (null clears it). Without it the progress row is left as it is.
    async saveEdit(propertyId, { fields, features, progress }, { transaction }) {
      await models.Property.update(fields, { where: { id: propertyId }, transaction });
      await models.PropertyFeature.destroy({ where: { propertyId }, transaction });
      await models.PropertyFeature.bulkCreate(
        features.map((name) => ({ propertyId, name })),
        { transaction },
      );
      if (!progress) return;
      const [row] = await models.PropertyConstructionProgress.findOrCreate({
        where: { propertyId },
        defaults: { propertyId, possessionDate: progress.possessionDate },
        transaction,
      });
      await row.update({ possessionDate: progress.possessionDate }, { transaction });
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
