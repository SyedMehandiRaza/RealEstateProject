// Success response helpers matching the API contract: { success: true, data, meta? }.
export function sendSuccess(res, data, { status = 200, meta } = {}) {
  return res.status(status).json(meta ? { success: true, data, meta } : { success: true, data });
}

export const paginationMeta = ({ page, pageSize, total }) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});
