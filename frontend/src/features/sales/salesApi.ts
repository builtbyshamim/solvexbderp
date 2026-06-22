import { baseApi } from "../../redux/api/baseApi";
import { tagTypes } from "../../redux/tag-types";

const COUPON_URL = "/sales/coupons";

const CUSTOMER_URL = "/sales/customers";
const CUSTOMER_TYPE_URL = "/sales/customer-types";
const SALE_URL = "/sales";
const QUOTATION_URL = "/sales/quotations";
const RETURN_URL = "/sales/returns";

export const salesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Customer Types ────────────────────────────────────────────────────
    getAllCustomerTypes: build.query({
      query: () => ({ url: CUSTOMER_TYPE_URL, method: 'GET' }),
      providesTags: [{ type: tagTypes.customer, id: 'TYPES' }],
    }),
    createCustomerType: build.mutation({
      query: (data) => ({ url: CUSTOMER_TYPE_URL, method: 'POST', data }),
      invalidatesTags: [{ type: tagTypes.customer, id: 'TYPES' }],
    }),
    updateCustomerType: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({ url: `${CUSTOMER_TYPE_URL}/${id}`, method: 'PATCH', data }),
      invalidatesTags: [{ type: tagTypes.customer, id: 'TYPES' }],
    }),
    deleteCustomerType: build.mutation({
      query: (id: string) => ({ url: `${CUSTOMER_TYPE_URL}/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: tagTypes.customer, id: 'TYPES' }],
    }),

    // ── Customers ──────────────────────────────────────────────────────────
    getAllCustomers: build.query({
      query: (params) => ({ url: CUSTOMER_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.customer, id: "LIST" }],
    }),
    getCustomer: build.query({
      query: (id: string) => ({ url: `${CUSTOMER_URL}/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: tagTypes.customer, id }],
    }),
    getCustomerStatement: build.query({
      query: ({ customerId, ...params }: { customerId: string; dateFrom?: string; dateTo?: string }) => ({
        url: `${CUSTOMER_URL}/${customerId}/statement`, method: "GET", params,
      }),
      providesTags: (_result, _error, { customerId }) => [{ type: tagTypes.customer, id: customerId }],
    }),

    createCustomerAdjustment: build.mutation({
      query: ({ customerId, data }: { customerId: string; data: any }) => ({
        url: `${CUSTOMER_URL}/${customerId}/adjust`,
        method: "POST",
        data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: tagTypes.customer, id: arg.customerId },
        { type: tagTypes.customer, id: "LIST" },
      ],
    }),
    createCustomer: build.mutation({
      query: (data) => ({ url: CUSTOMER_URL, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.customer, id: "LIST" }],
    }),
    importCustomers: build.mutation({
      query: (formData: FormData) => ({
        url: `${CUSTOMER_URL}/import`,
        method: "POST",
        data: formData,
      }),
      invalidatesTags: [{ type: tagTypes.customer, id: "LIST" }],
    }),
    updateCustomer: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({ url: `${CUSTOMER_URL}/${id}`, method: "PATCH", data }),
      invalidatesTags: (_result, _error, arg) => [
        { type: tagTypes.customer, id: arg.id },
        { type: tagTypes.customer, id: "LIST" },
      ],
    }),
    deleteCustomer: build.mutation({
      query: (id: string) => ({ url: `${CUSTOMER_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.customer, id: "LIST" }],
    }),

    // ── Sales ──────────────────────────────────────────────────────────────
    getAllSales: build.query({
      query: (params) => ({ url: SALE_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.sale, id: "LIST" }],
    }),
    getSale: build.query({
      query: (id: string) => ({ url: `${SALE_URL}/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: tagTypes.sale, id }],
    }),
    createSale: build.mutation({
      query: (data) => ({ url: SALE_URL, method: "POST", data }),
      invalidatesTags: [
        { type: tagTypes.sale, id: "LIST" },
        { type: tagTypes.customer, id: "LIST" },
        { type: tagTypes.product, id: "LIST" },
        { type: tagTypes.stockLedger, id: "LIST" },
      ],
    }),
    updateSale: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${SALE_URL}/${id}`, method: "PATCH", data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: tagTypes.sale, id: arg.id },
        { type: tagTypes.sale, id: "LIST" },
        { type: tagTypes.customer, id: "LIST" },
        { type: tagTypes.product, id: "LIST" },
        { type: tagTypes.stockLedger, id: "LIST" },
        { type: tagTypes.account, id: "LIST" },
      ],
    }),
    cancelSale: build.mutation({
      query: (id: string) => ({ url: `${SALE_URL}/${id}/cancel`, method: "PATCH" }),
      invalidatesTags: [{ type: tagTypes.sale, id: "LIST" }, { type: tagTypes.product, id: "LIST" }],
    }),
    collectPayment: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${SALE_URL}/${id}/collect-payment`, method: "POST", data,
      }),
      invalidatesTags: [
        { type: tagTypes.sale, id: "LIST" },
        { type: tagTypes.customer, id: "LIST" },
        { type: tagTypes.collection, id: "LIST" },
      ],
    }),
    collectBulkPayment: build.mutation({
      query: ({ customerId, data }: { customerId: string; data: any }) => ({
        url: `${CUSTOMER_URL}/${customerId}/collect`, method: "POST", data,
      }),
      invalidatesTags: [
        { type: tagTypes.sale, id: "LIST" },
        { type: tagTypes.customer, id: "LIST" },
        { type: tagTypes.collection, id: "LIST" },
      ],
    }),
    getCollectionReport: build.query({
      query: (params) => ({ url: `${SALE_URL}/collections`, method: "GET", params }),
      providesTags: [{ type: tagTypes.collection, id: "LIST" }],
    }),
    getSalesDashboardStats: build.query({
      query: () => ({ url: `${SALE_URL}/dashboard-stats`, method: "GET" }),
      providesTags: [{ type: tagTypes.sale, id: "STATS" }],
    }),

    // ── Quotations ─────────────────────────────────────────────────────────
    getAllQuotations: build.query({
      query: (params) => ({ url: QUOTATION_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.quotation, id: "LIST" }],
    }),
    createQuotation: build.mutation({
      query: (data) => ({ url: QUOTATION_URL, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.quotation, id: "LIST" }],
    }),
    updateQuotationStatus: build.mutation({
      query: ({ id, status }: { id: string; status: string }) => ({
        url: `${QUOTATION_URL}/${id}/status`, method: "PATCH", data: { status },
      }),
      invalidatesTags: [{ type: tagTypes.quotation, id: "LIST" }],
    }),
    convertQuotation: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${QUOTATION_URL}/${id}/convert`, method: "POST", data,
      }),
      invalidatesTags: [
        { type: tagTypes.quotation, id: "LIST" },
        { type: tagTypes.sale, id: "LIST" },
        { type: tagTypes.product, id: "LIST" },
      ],
    }),

    // ── Sale Returns ───────────────────────────────────────────────────────
    getAllSaleReturns: build.query({
      query: (params) => ({ url: RETURN_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.saleReturn, id: "LIST" }],
    }),
    createSaleReturn: build.mutation({
      query: (data) => ({ url: RETURN_URL, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.saleReturn, id: "LIST" }],
    }),
    approveReturn: build.mutation({
      query: (id: string) => ({ url: `${RETURN_URL}/${id}/approve`, method: "PATCH" }),
      invalidatesTags: [
        { type: tagTypes.saleReturn, id: "LIST" },
        { type: tagTypes.product, id: "LIST" },
        { type: tagTypes.customer, id: "LIST" },
      ],
    }),

    // ── Coupons ────────────────────────────────────────────────────────────
    getAllCoupons: build.query({
      query: () => ({ url: COUPON_URL, method: "GET" }),
      providesTags: [{ type: tagTypes.sale, id: "COUPONS" }],
    }),
    createCoupon: build.mutation({
      query: (data: any) => ({ url: COUPON_URL, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.sale, id: "COUPONS" }],
    }),
    updateCoupon: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({ url: `${COUPON_URL}/${id}`, method: "PATCH", data }),
      invalidatesTags: [{ type: tagTypes.sale, id: "COUPONS" }],
    }),
    deleteCoupon: build.mutation({
      query: (id: string) => ({ url: `${COUPON_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.sale, id: "COUPONS" }],
    }),
    validateCoupon: build.mutation({
      query: (data: { code: string; subtotal: number }) => ({ url: `${COUPON_URL}/validate`, method: "POST", data }),
    }),
  }),
});

export const {
  useGetAllCustomerTypesQuery,
  useCreateCustomerTypeMutation,
  useUpdateCustomerTypeMutation,
  useDeleteCustomerTypeMutation,
  useGetAllCustomersQuery,
  useGetCustomerQuery,
  useGetCustomerStatementQuery,
  useCreateCustomerAdjustmentMutation,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useImportCustomersMutation,
  useGetAllSalesQuery,
  useGetSaleQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useCancelSaleMutation,
  useCollectPaymentMutation,
  useCollectBulkPaymentMutation,
  useGetCollectionReportQuery,
  useGetSalesDashboardStatsQuery,
  useGetAllQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationStatusMutation,
  useConvertQuotationMutation,
  useGetAllSaleReturnsQuery,
  useCreateSaleReturnMutation,
  useApproveReturnMutation,
  useGetAllCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useValidateCouponMutation,
} = salesApi;
