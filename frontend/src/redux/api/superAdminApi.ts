import { tagTypes } from '../tag-types';
import { baseApi } from './baseApi';

const SA_URL = '/super-admin';

export const superAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Dashboard stats
    getSuperAdminDashboard: build.query({
      query: () => ({ url: `${SA_URL}/dashboard`, method: 'GET' }),
      providesTags: [tagTypes.superAdmin],
    }),

    // Businesses
    getAllBusinesses: build.query({
      query: (params) => ({ url: `${SA_URL}/businesses`, method: 'GET', params }),
      providesTags: [tagTypes.superAdmin],
    }),

    getBusinessDetail: build.query({
      query: (id: string) => ({ url: `${SA_URL}/businesses/${id}`, method: 'GET' }),
      providesTags: [tagTypes.superAdmin],
    }),

    toggleBusinessStatus: build.mutation({
      query: ({ id, status }: { id: string; status: string }) => ({
        url: `${SA_URL}/businesses/${id}/status`,
        method: 'PATCH',
        data: { status },
      }),
      invalidatesTags: [tagTypes.superAdmin],
    }),

    updateSubscription: build.mutation({
      query: ({ id, ...data }: { id: string; [key: string]: any }) => ({
        url: `${SA_URL}/businesses/${id}/subscription`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: [tagTypes.superAdmin],
    }),

    resetBusinessData: build.mutation({
      query: ({ id, ...data }: { id: string; [key: string]: any }) => ({
        url: `${SA_URL}/businesses/${id}/reset`,
        method: 'POST',
        data,
      }),
      invalidatesTags: [tagTypes.superAdmin],
    }),
  }),
});

export const {
  useGetSuperAdminDashboardQuery,
  useGetAllBusinessesQuery,
  useGetBusinessDetailQuery,
  useToggleBusinessStatusMutation,
  useUpdateSubscriptionMutation,
  useResetBusinessDataMutation,
} = superAdminApi;
