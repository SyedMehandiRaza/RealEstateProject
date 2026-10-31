import { sendSuccess } from '../../utils/response.js';

// HTTP only: read the validated input, call the service, send the response.
export function createPropertyController(service) {
  return {
    async listProperties(req, res) {
      const { data, meta } = await service.listProperties({
        ownerId: req.user.id,
        query: req.validated.query,
      });
      sendSuccess(res, data, { meta });
    },

    async getProperty(req, res) {
      sendSuccess(res, await service.getProperty(req.property));
    },

    async editProperty(req, res) {
      sendSuccess(
        res,
        await service.editProperty({
          ownerId: req.user.id,
          property: req.property,
          body: req.validated.body,
        }),
      );
    },

    async createProperty(req, res) {
      sendSuccess(res, await service.createProperty({ ownerId: req.user.id, body: req.validated.body }), {
        status: 201,
      });
    },

    async stageUpload(req, res) {
      sendSuccess(res, await service.stageUpload({ ownerId: req.user.id, file: req.validated.file }), {
        status: 201,
      });
    },
  };
}
