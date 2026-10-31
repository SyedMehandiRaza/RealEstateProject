import { paginationMeta, sendSuccess } from '../../utils/response.js';

// HTTP only: read the validated input and the caller, call the service, send the response.
export function createStaffController(staffService) {
  return {
    async list(req, res) {
      const { page, pageSize } = req.validated.query;
      const { staffMembers, total } = await staffService.list(req.user.id, { page, pageSize });
      sendSuccess(res, staffMembers, { meta: paginationMeta({ page, pageSize, total }) });
    },
  };
}
