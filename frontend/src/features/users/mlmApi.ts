import { baseApi } from '../../redux/api/baseApi.js';
export const mlmApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Binary Tree ──────────────────────────────────────────────────────
    getBinaryTree: builder.query<any, { userId: string; depth?: number }>({
      query: ({ userId, depth = 5 }) => ({
        url: `/mlm/binary/tree/${userId}`,
        params: { depth },
      }),
    }),

    getBinaryStats: builder.query<any, { userId: string }>({
      query: ({ userId }) => `/mlm/binary/stats/${userId}`,
    }),

    countBinaryLevel: builder.query<any, { userId: string; level: number }>({
      query: ({ userId, level }) => ({
        url: `/mlm/binary/level/${userId}`,
        params: { level },
      }),
    }),

    // ─── Matrix Tree ──────────────────────────────────────────────────────
    getMatrixTree: builder.query<any, { userId: string; depth?: number }>({
      query: ({ userId, depth = 3 }) => ({
        url: `/mlm/matrix/tree/${userId}`,
        params: { depth },
      }),
    }),

    getMatrixStats: builder.query<any, { userId: string }>({
      query: ({ userId }) => `/mlm/matrix/stats/${userId}`,
    }),

    // ─── Referrals ────────────────────────────────────────────────────────
    getDirectReferrals: builder.query<any, { userId: string }>({
      query: ({ userId }) => `/mlm/referrals/${userId}`,
    }),

    getReferralSummary: builder.query<any, { userId: string }>({
      query: ({ userId }) => `/mlm/referrals/summary/${userId}`,
    }),

    // ─── Registration ─────────────────────────────────────────────────────
    registerWithReferral: builder.mutation<any, any>({
      query: (body) => ({
        url: '/mlm/register',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetBinaryTreeQuery,
  useGetBinaryStatsQuery,
  useCountBinaryLevelQuery,
  useGetMatrixTreeQuery,
  useGetMatrixStatsQuery,
  useGetDirectReferralsQuery,
  useGetReferralSummaryQuery,
  useRegisterWithReferralMutation,
} = mlmApi;
