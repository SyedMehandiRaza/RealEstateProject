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
    // E3.
    getStaff: build.query({
      query: (id) => `/staff/${id}`,
      transformResponse: (response) => response.data.staffMember,
      providesTags: (result, error, id) => [{ type: 'Staff', id }],
    }),
    // E2.
    createStaff: build.mutation({
      query: (body) => ({ url: '/staff', method: 'POST', body }),
      transformResponse: (response) => response.data.staffMember,
      invalidatesTags: [{ type: 'Staff', id: 'LIST' }],
    }),
    // E4.
    updateStaff: build.mutation({
      query: ({ id, ...body }) => ({ url: `/staff/${id}`, method: 'PUT', body }),
      transformResponse: (response) => response.data.staffMember,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Staff', id: 'LIST' },
        { type: 'Staff', id },
      ],
    }),
  }),
});

export const { useListStaffQuery, useGetStaffQuery, useCreateStaffMutation, useUpdateStaffMutation } =
  staffApi;

// The API's message for a failed request, or the shared load-failed text when there is none (network).
export const apiErrorMessage = (error, fallback) => error?.data?.error?.message ?? fallback;
