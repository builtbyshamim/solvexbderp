import { tagTypes } from '../../redux/tag-types';
import { baseApi } from '../../redux/api/baseApi';

const BASE = '/affiliate';

export const affiliateApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ─── User ────────────────────────────────────────────────────────────────
    applyAffiliate: build.mutation({
      query: (data) => ({ url: `${BASE}/apply`, method: 'POST', data }),
      invalidatesTags: [tagTypes.affiliate],
    }),
    getMyAffiliate: build.query({
      query: () => ({ url: `${BASE}/me`, method: 'GET' }),
      providesTags: [tagTypes.affiliate],
    }),
    getMyReferrals: build.query({
      query: (params) => ({ url: `${BASE}/me/referrals`, method: 'GET', params }),
      providesTags: [tagTypes.affiliate],
    }),
    getMyCommissions: build.query({
      query: (params) => ({ url: `${BASE}/me/commissions`, method: 'GET', params }),
      providesTags: [tagTypes.affiliate],
    }),

    // ─── Admin ───────────────────────────────────────────────────────────────
    getAffiliateStats: build.query({
      query: () => ({ url: `${BASE}/admin/stats`, method: 'GET' }),
      providesTags: [tagTypes.affiliate],
    }),
    getAllAffiliates: build.query({
      query: (params) => ({ url: `${BASE}/admin`, method: 'GET', params }),
      providesTags: [tagTypes.affiliate],
    }),
    getAffiliateById: build.query({
      query: (id: string) => ({ url: `${BASE}/admin/${id}`, method: 'GET' }),
      providesTags: [tagTypes.affiliate],
    }),
    updateAffiliateStatus: build.mutation({
      query: ({ id, ...data }) => ({ url: `${BASE}/admin/${id}/status`, method: 'PATCH', data }),
      invalidatesTags: [tagTypes.affiliate],
    }),
    updateCommissionRate: build.mutation({
      query: ({ id, ...data }) => ({ url: `${BASE}/admin/${id}/commission-rate`, method: 'PATCH', data }),
      invalidatesTags: [tagTypes.affiliate],
    }),
    syncReferrals: build.mutation({
      query: (id: string) => ({ url: `${BASE}/admin/${id}/sync-referrals`, method: 'POST' }),
      invalidatesTags: [tagTypes.affiliate],
    }),
    recordCommission: build.mutation({
      query: (data) => ({ url: `${BASE}/admin/commissions/record`, method: 'POST', data }),
      invalidatesTags: [tagTypes.affiliate],
    }),
    generateMonthlyCommissions: build.mutation({
      query: (data) => ({ url: `${BASE}/admin/commissions/generate-monthly`, method: 'POST', data }),
      invalidatesTags: [tagTypes.affiliate],
    }),
    getAllCommissions: build.query({
      query: (params) => ({ url: `${BASE}/admin/commissions`, method: 'GET', params }),
      providesTags: [tagTypes.affiliate],
    }),
    updateCommissionStatus: build.mutation({
      query: ({ id, ...data }) => ({ url: `${BASE}/admin/commissions/${id}`, method: 'PATCH', data }),
      invalidatesTags: [tagTypes.affiliate],
    }),
    createPayout: build.mutation({
      query: (data) => ({ url: `${BASE}/admin/payouts`, method: 'POST', data }),
      invalidatesTags: [tagTypes.affiliate],
    }),
    getAllPayouts: build.query({
      query: (params) => ({ url: `${BASE}/admin/payouts`, method: 'GET', params }),
      providesTags: [tagTypes.affiliate],
    }),
  }),
});

export const {
  useApplyAffiliateMutation,
  useGetMyAffiliateQuery,
  useGetMyReferralsQuery,
  useGetMyCommissionsQuery,
  useGetAffiliateStatsQuery,
  useGetAllAffiliatesQuery,
  useGetAffiliateByIdQuery,
  useUpdateAffiliateStatusMutation,
  useUpdateCommissionRateMutation,
  useSyncReferralsMutation,
  useRecordCommissionMutation,
  useGenerateMonthlyCommissionsMutation,
  useGetAllCommissionsQuery,
  useUpdateCommissionStatusMutation,
  useCreatePayoutMutation,
  useGetAllPayoutsQuery,
} = affiliateApi;
