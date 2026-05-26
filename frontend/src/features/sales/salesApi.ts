import { baseApi } from "../../redux/api/baseApi";
import { tagTypes } from "../../redux/tag-types";

const CUSTOMER_URL = "/sales/customers";
const SALE_URL = "/sales";

export const salesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Customers
    getAllCustomers: build.query({
      query: (params) => ({ url: CUSTOMER_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.customer, id: "LIST" }],
    }),
    getCustomer: build.query({
      query: (id: string) => ({ url: `${CUSTOMER_URL}/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: tagTypes.customer, id }],
    }),
    createCustomer: build.mutation({
      query: (data) => ({ url: CUSTOMER_URL, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.customer, id: "LIST" }],
    }),
    updateCustomer: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${CUSTOMER_URL}/${id}`, method: "PATCH", data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: tagTypes.customer, id: arg.id },
        { type: tagTypes.customer, id: "LIST" },
      ],
    }),
    deleteCustomer: build.mutation({
      query: (id: string) => ({ url: `${CUSTOMER_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.customer, id: "LIST" }],
    }),

    // Sales
    getAllSales: build.query({
      query: (params) => ({ url: SALE_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.sale, id: "LIST" }],
    }),
    getSale: build.query({
      query: (id: string) => ({ url: `${SALE_URL}/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: tagTypes.sale, id }],
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
    getSalesDashboardStats: build.query({
      query: () => ({ url: `${SALE_URL}/dashboard-stats`, method: "GET" }),
      providesTags: [{ type: tagTypes.sale, id: "STATS" }],
    }),
  }),
});

export const {
  useGetAllCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetAllSalesQuery,
  useGetSaleQuery,
  useCreateSaleMutation,
  useGetSalesDashboardStatsQuery,
} = salesApi;
