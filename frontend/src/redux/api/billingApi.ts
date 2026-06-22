import { tagTypes } from '../tag-types';
import { baseApi } from './baseApi';

const URL = '/billing';

export type PaymentMethod = 'bkash' | 'rocket' | 'nagad';
export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id: string;
  packageId: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod: PaymentMethod;
  senderMobile: string;
  transactionId: string;
  amount: number;
  status: PaymentRequestStatus;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  package: { id: string; name: string; badge?: string } | null;
  business?: { id: string; name: string } | null;
}

export interface CreatePaymentRequestPayload {
  packageId: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod: PaymentMethod;
  senderMobile: string;
  transactionId: string;
  amount: number;
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPaymentInfo: build.query<{ receiveNumber: string; methods: string[]; instructions: string[] }, void>({
      query: () => ({ url: `${URL}/payment-info`, method: 'GET' }),
    }),

    createPaymentRequest: build.mutation<{ message: string; request: PaymentRequest }, CreatePaymentRequestPayload>({
      query: (data) => ({ url: `${URL}/payment-request`, method: 'POST', data }),
      invalidatesTags: [tagTypes.paymentRequest, tagTypes.auth],
    }),

    getMyPaymentRequests: build.query<PaymentRequest[], void>({
      query: () => ({ url: `${URL}/payment-requests`, method: 'GET' }),
      providesTags: [tagTypes.paymentRequest],
    }),

    getMyPendingRequest: build.query<PaymentRequest | null, void>({
      query: () => ({ url: `${URL}/payment-requests/pending`, method: 'GET' }),
      providesTags: [tagTypes.paymentRequest],
    }),

    // Super Admin
    getAllPaymentRequests: build.query<
      { items: PaymentRequest[]; total: number; page: number; totalPages: number },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: `/super-admin/payment-requests`, method: 'GET', params }),
      providesTags: [tagTypes.paymentRequest],
    }),

    getPendingCount: build.query<{ count: number }, void>({
      query: () => ({ url: `/super-admin/payment-requests/pending-count`, method: 'GET' }),
      providesTags: [tagTypes.paymentRequest],
    }),

    reviewPaymentRequest: build.mutation<
      { message: string; request: PaymentRequest },
      { id: string; action: 'approved' | 'rejected'; adminNote?: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/super-admin/payment-requests/${id}/review`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: [tagTypes.paymentRequest, tagTypes.superAdmin],
    }),
  }),
});

export const {
  useGetPaymentInfoQuery,
  useCreatePaymentRequestMutation,
  useGetMyPaymentRequestsQuery,
  useGetMyPendingRequestQuery,
  useGetAllPaymentRequestsQuery,
  useGetPendingCountQuery,
  useReviewPaymentRequestMutation,
} = billingApi;
