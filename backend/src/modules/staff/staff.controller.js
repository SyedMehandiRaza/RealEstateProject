import { paginationMeta, sendSuccess } from '../../utils/response.js';

// HTTP only: read the validated input and the caller, call the service, send the response.
export function createStaffController(staffService) {
  return {
    async list(req, res) {
      const { page, pageSize } = req.validated.query;
      const { staffMembers, total } = await staffService.list(req.user.id, { page, pageSize });
      sendSuccess(res, staffMembers, { meta: paginationMeta({ page, pageSize, total }) });
    },

    async create(req, res) {
      sendSuccess(res, await staffService.create(req.user.id, req.validated.body), { status: 201 });
    },

    async get(req, res) {
      sendSuccess(res, await staffService.get(req.user.id, req.validated.params.id));
    },

    async update(req, res) {
      sendSuccess(res, await staffService.update(req.user.id, req.validated.params.id, req.validated.body));
    },

    async changeStatus(req, res) {
      sendSuccess(
        res,
        await staffService.changeStatus(req.user.id, req.validated.params.id, req.validated.body),
      );
    },

    async remove(req, res) {
      await staffService.remove(req.user.id, req.validated.params.id);
      res.status(204).end();
    },

    async assignableProperties(req, res) {
      sendSuccess(res, await staffService.assignableProperties(req.user.id, req.validated.params.id));
    },

    async assignProperty(req, res) {
      const { params, body } = req.validated;
      sendSuccess(res, await staffService.assignProperty(req.user.id, params.id, body), { status: 201 });
    },

    async unassignProperty(req, res) {
      const { id, propertyId } = req.validated.params;
      sendSuccess(res, await staffService.unassignProperty(req.user.id, id, propertyId));
    },
  };
}
