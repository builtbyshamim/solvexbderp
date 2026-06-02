import { baseApi } from "../../redux/api/baseApi";
import { tagTypes } from "../../redux/tag-types";

const REPORT_URL = "/reports";

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSalesSummary: build.query({
      query: (params) => ({ url: `${REPORT_URL}/sales-summary`, method: "GET", params }),
      providesTags: [{ type: tagTypes.report, id: "SALES_SUMMARY" }],
    }),
    getPurchaseSummary: build.query({
      query: (params) => ({ url: `${REPORT_URL}/purchase-summary`, method: "GET", params }),
      providesTags: [{ type: tagTypes.report, id: "PURCHASE_SUMMARY" }],
    }),
    getSalesByDate: build.query({
      query: (params) => ({ url: `${REPORT_URL}/sales-by-date`, method: "GET", params }),
      providesTags: [{ type: tagTypes.report, id: "SALES_BY_DATE" }],
    }),
    getTopProducts: build.query({
      query: (params) => ({ url: `${REPORT_URL}/top-products`, method: "GET", params }),
      providesTags: [{ type: tagTypes.report, id: "TOP_PRODUCTS" }],
    }),
    getTopCustomers: build.query({
      query: (params) => ({ url: `${REPORT_URL}/top-customers`, method: "GET", params }),
      providesTags: [{ type: tagTypes.report, id: "TOP_CUSTOMERS" }],
    }),
    getStockValuation: build.query({
      query: () => ({ url: `${REPORT_URL}/stock-valuation`, method: "GET" }),
      providesTags: [{ type: tagTypes.report, id: "STOCK_VALUATION" }],
    }),
    getProfitLoss: build.query({
      query: (params) => ({ url: `${REPORT_URL}/profit-loss`, method: "GET", params }),
      providesTags: [{ type: tagTypes.report, id: "PROFIT_LOSS" }],
    }),
    getReceivables: build.query({
      query: () => ({ url: `${REPORT_URL}/receivables`, method: "GET" }),
      providesTags: [{ type: tagTypes.report, id: "RECEIVABLES" }],
    }),
    getPayables: build.query({
      query: () => ({ url: `${REPORT_URL}/payables`, method: "GET" }),
      providesTags: [{ type: tagTypes.report, id: "PAYABLES" }],
    }),
    getTopSuppliers: build.query({
      query: (params) => ({ url: `${REPORT_URL}/top-suppliers`, method: "GET", params }),
      providesTags: [{ type: tagTypes.report, id: "TOP_SUPPLIERS" }],
    }),
  }),
});

export const {
  useGetSalesSummaryQuery,
  useGetPurchaseSummaryQuery,
  useGetSalesByDateQuery,
  useGetTopProductsQuery,
  useGetTopCustomersQuery,
  useGetStockValuationQuery,
  useGetProfitLossQuery,
  useGetReceivablesQuery,
  useGetPayablesQuery,
  useGetTopSuppliersQuery,
} = reportsApi;
