import { UniqueConstraintError } from 'sequelize';
import { propertyMessages as m, WIZARD_DOCUMENT_SLOTS } from '@real-estate/shared';
import { AppError } from '../../utils/AppError.js';
import { presentPropertyDetail } from './property.presenter.js';
import { RESOURCE_TYPE_BY_MIME } from './propertyUpload.js';

const MEDIA_GROUPS = { images: 'image', videos: 'video', tours: 'tour_360' };

// Every upload token of a validated create body: { token, path, purpose }, in request order.
function tokenSlots(body) {
  const slots = [];
  body.configurations.forEach((configuration, i) =>
    configuration.floorPlans.forEach((token, j) =>
      slots.push({ token, path: `configurations.${i}.floorPlans.${j}`, purpose: 'floor_plan' }),
    ),
  );
  for (const [group, purpose] of Object.entries(MEDIA_GROUPS)) {
    body.media[group].forEach((token, i) => slots.push({ token, path: `media.${group}.${i}`, purpose }));
  }
  for (const slot of Object.keys(WIZARD_DOCUMENT_SLOTS)) {
    const token = body.documents[slot];
    if (token !== undefined) slots.push({ token, path: `documents.${slot}`, purpose: 'document' });
  }
  return slots;
}

const tokenConflict = (paths) =>
  new AppError('CONFLICT', {
    fields: Object.fromEntries(paths.map((path) => [path, [m.uploadToken.invalid]])),
  });

// Business rules of the property module (PROP-SPEC-001).
export function createPropertyService({
  sequelize,
  repository,
  storage,
  clock,
  uploadTokens,
  findReferencedPublicIds,
}) {
  const detail = async (id) =>
    presentPropertyDetail(await repository.findDetail(id), { storage, now: clock.now() });

  return {
    // Stages a wizard file under the owner's staging folder and returns its upload token (PROP-DEC-012).
    // Rows are created on Submit; until then the orphan job removes a staged file after 24 hours.
    async stageUpload({ ownerId, file }) {
      const resourceType = RESOURCE_TYPE_BY_MIME[file.mimeType];
      const uploaded = await storage.upload(file.buffer, {
        publicId: storage.newPublicId(`properties/${ownerId}/staging`, resourceType, 'pdf'),
        resourceType,
      });
      const { purpose, fileName, mimeType, sizeBytes } = file;
      const uploadToken = uploadTokens.issue({
        ownerId,
        purpose,
        publicId: uploaded.publicId,
        resourceType,
        mimeType,
        sizeBytes,
        fileName,
      });
      return { upload: { uploadToken, purpose, fileName, mimeType, sizeBytes } };
    },

    // Add Property Submit (PROP-DEC-012): every token must be valid, unexpired, the caller's and staged for
    // its slot (422 at its path otherwise); a token whose file is already stored is 409 at its path. Then
    // the whole property is written in one transaction. Returns { property } in the detail shape.
    async createProperty({ ownerId, body }) {
      const slots = tokenSlots(body);
      const invalid = {};
      const uploads = new Map();
      for (const { token, path, purpose } of slots) {
        const upload = uploadTokens.read(token, { ownerId, purposes: [purpose] });
        if (upload && RESOURCE_TYPE_BY_MIME[upload.mimeType] === upload.resourceType)
          uploads.set(path, upload);
        else invalid[path] = [m.uploadToken.invalid];
      }
      if (Object.keys(invalid).length > 0) throw new AppError('VALIDATION_ERROR', { fields: invalid });

      const pathOf = new Map([...uploads].map(([path, upload]) => [upload.publicId, path]));
      const stored = await findReferencedPublicIds([...pathOf.keys()]);
      if (stored.size > 0) throw tokenConflict([...stored].map((publicId) => pathOf.get(publicId)));

      const { features, possessionDate, configurations, media, documents, ...fields } = body;
      let property;
      try {
        property = await sequelize.transaction((transaction) =>
          repository.createGraph(
            {
              ownerId,
              fields,
              features,
              configurations: configurations.map(({ floorPlans, ...configuration }, i) => ({
                ...configuration,
                floorPlans: floorPlans.map((_, j) => uploads.get(`configurations.${i}.floorPlans.${j}`)),
              })),
              media: Object.fromEntries(
                Object.entries(MEDIA_GROUPS).map(([group, mediaType]) => [
                  mediaType,
                  media[group].map((_, i) => uploads.get(`media.${group}.${i}`)),
                ]),
              ),
              documents: Object.entries(WIZARD_DOCUMENT_SLOTS)
                .filter(([slot]) => documents[slot] !== undefined)
                .map(([slot, documentType]) => ({ documentType, upload: uploads.get(`documents.${slot}`) })),
              progress:
                fields.propertyStatus === 'under_construction'
                  ? { possessionDate: possessionDate ?? null }
                  : null,
            },
            { transaction },
          ),
        );
      } catch (error) {
        // Two Submits racing with the same token: the second hits the unique public id.
        const publicId = error instanceof UniqueConstraintError ? error.errors?.[0]?.value : undefined;
        if (pathOf.has(publicId)) throw tokenConflict([pathOf.get(publicId)]);
        throw error;
      }
      return { property: await detail(property.id) };
    },
  };
}
