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
    // E5. The returned member replaces the cached Detail; the list refetches.
    changeStaffStatus: build.mutation({
      query: ({ id, status }) => ({ url: `/staff/${id}/status`, method: 'PATCH', body: { status } }),
      transformResponse: (response) => response.data.staffMember,
      onQueryStarted: (args, api) => replaceCachedMember(args.id, api),
      invalidatesTags: [{ type: 'Staff', id: 'LIST' }],
    }),
    // E7. Refetched after every assign / unassign of this member.
    listAssignableProperties: build.query({
      query: (id) => `/staff/${id}/assignable-properties`,
      transformResponse: (response) => response.data.properties,
      providesTags: (result, error, id) => [{ type: 'Staff', id: `assignable-${id}` }],
    }),
    // E8. Also refetches the picker on a 404 / 409, so it never offers a property that is gone or taken.
    assignProperty: build.mutation({
      query: ({ id, propertyId }) => ({
        url: `/staff/${id}/properties`,
        method: 'POST',
        body: { propertyId },
      }),
      transformResponse: (response) => response.data.staffMember,
      onQueryStarted: (args, api) => replaceCachedMember(args.id, api),
      invalidatesTags: (result, error, { id }) => [{ type: 'Staff', id: `assignable-${id}` }],
    }),
    // E9.
    unassignProperty: build.mutation({
      query: ({ id, propertyId }) => ({ url: `/staff/${id}/properties/${propertyId}`, method: 'DELETE' }),
      transformResponse: (response) => response.data.staffMember,
      onQueryStarted: (args, api) => replaceCachedMember(args.id, api),
      invalidatesTags: (result, error, { id }) => [{ type: 'Staff', id: `assignable-${id}` }],
    }),
    // E6. Also invalidates on 404 (already removed), so the list drops the member either way.
    removeStaff: build.mutation({
      query: (id) => ({ url: `/staff/${id}`, method: 'DELETE' }),
      // The member's own tag too, so its cached Detail is never shown again.
      invalidatesTags: (result, error, id) => [
        { type: 'Staff', id: 'LIST' },
        { type: 'Staff', id },
      ],
    }),
  }),
});

// After a mutation that answers with the whole member, put it in the getStaff cache for that id.
async function replaceCachedMember(id, { dispatch, queryFulfilled }) {
  try {
    const { data } = await queryFulfilled;
    dispatch(staffApi.util.updateQueryData('getStaff', id, () => data));
  } catch {
    // The caller shows the error; the cached member stays as it was.
  }
}

export const {
  useListStaffQuery,
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useChangeStaffStatusMutation,
  useRemoveStaffMutation,
  useListAssignablePropertiesQuery,
  useAssignPropertyMutation,
  useUnassignPropertyMutation,
} = staffApi;

// The API's message for a failed request, or the shared load-failed text when there is none (network).
export const apiErrorMessage = (error, fallback) => error?.data?.error?.message ?? fallback;
