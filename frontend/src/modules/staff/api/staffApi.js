import { baseApi } from '../../../services/api/baseApi.js';

// Staff endpoints (STAFF-SPEC-001), injected into the shared baseApi. The "Staff" tag is added here so
// baseApi itself does not change.
export const staffApi = baseApi.enhanceEndpoints({ addTagTypes: ['Staff'] }).injectEndpoints({
  endpoints: (build) => ({
    // E1. The whole response is kept, so the page reads `meta` for the page controls.
    listStaff: build.query({
      query: ({ page, pageSize }) => ({ url: '/staff', params: { page, pageSize } }),
      providesTags: [{ type: 'Staff', id: 'LIST' }],
    }),
  }),
});

export const { useListStaffQuery } = staffApi;

// The API's message for a failed request, or the shared load-failed text when there is none (network).
export const apiErrorMessage = (error, fallback) => error?.data?.error?.message ?? fallback;
