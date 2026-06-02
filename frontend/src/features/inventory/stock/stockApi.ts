import { baseApi } from "../../../redux/api/baseApi";
import { tagTypes } from "../../../redux/tag-types";

const STOCK_URL = "/inventory/stock";

export const stockApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdjustments: build.query({
      query: (params) => ({ url: `${STOCK_URL}/adjustments`, method: "GET", params }),
      providesTags: [{ type: tagTypes.stockAdjustment, id: "LIST" }],
    }),
    createAdjustment: build.mutation({
      query: (data) => ({ url: `${STOCK_URL}/adjustments`, method: "POST", data }),
      invalidatesTags: [
        { type: tagTypes.stockAdjustment, id: "LIST" },
        { type: tagTypes.stockLedger, id: "LIST" },
        { type: tagTypes.product, id: "LIST" },
      ],
    }),

    getTransfers: build.query({
      query: (params) => ({ url: `${STOCK_URL}/transfers`, method: "GET", params }),
      providesTags: [{ type: tagTypes.stockTransfer, id: "LIST" }],
    }),
    createTransfer: build.mutation({
      query: (data) => ({ url: `${STOCK_URL}/transfers`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.stockTransfer, id: "LIST" }],
    }),
    approveTransfer: build.mutation({
      query: (id: string) => ({
        url: `${STOCK_URL}/transfers/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: tagTypes.stockTransfer, id: "LIST" },
        { type: tagTypes.stockLedger, id: "LIST" },
        { type: tagTypes.product, id: "LIST" },
      ],
    }),
    cancelTransfer: build.mutation({
      query: (id: string) => ({
        url: `${STOCK_URL}/transfers/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: tagTypes.stockTransfer, id: "LIST" }],
    }),

    getStockLedger: build.query({
      query: (params) => ({ url: `${STOCK_URL}/ledger`, method: "GET", params }),
      providesTags: [{ type: tagTypes.stockLedger, id: "LIST" }],
    }),
  }),
});

export const {
  useGetAdjustmentsQuery,
  useCreateAdjustmentMutation,
  useGetTransfersQuery,
  useCreateTransferMutation,
  useApproveTransferMutation,
  useCancelTransferMutation,
  useGetStockLedgerQuery,
} = stockApi;
