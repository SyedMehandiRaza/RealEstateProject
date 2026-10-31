import { RESOURCE_TYPE_BY_MIME } from './propertyUpload.js';

// Business rules of the property module (PROP-SPEC-001).
export function createPropertyService({ storage, uploadTokens }) {
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
  };
}
