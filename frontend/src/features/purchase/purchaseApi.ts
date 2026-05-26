import { baseApi } from "../../redux/api/baseApi";
import { tagTypes } from "../../redux/tag-types";

const SUPPLIER_URL = "/purchase/suppliers";
const PURCHASE_URL = "/purchase";

export const purchaseApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Suppliers
    getAllSuppliers: build.query({
      query: (params) => ({ url: SUPPLIER_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.supplier, id: "LIST" }],
    }),
    getSupplier: build.query({
      query: (id: string) => ({ url: `${SUPPLIER_URL}/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: tagTypes.supplier, id }],
    }),
    createSupplier: build.mutation({
      query: (data) => ({ url: SUPPLIER_URL, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.supplier, id: "LIST" }],
    }),
    updateSupplier: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${SUPPLIER_URL}/${id}`, method: "PATCH", data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: tagTypes.supplier, id: arg.id },
        { type: tagTypes.supplier, id: "LIST" },
      ],
    }),
    deleteSupplier: build.mutation({
      query: (id: string) => ({ url: `${SUPPLIER_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.supplier, id: "LIST" }],
    }),

    // Purchases
    getAllPurchases: build.query({
      query: (params) => ({ url: PURCHASE_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.purchase, id: "LIST" }],
    }),
    getPurchase: build.query({
      query: (id: string) => ({ url: `${PURCHASE_URL}/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: tagTypes.purchase, id }],
    }),
    createPurchase: build.mutation({
      query: (data) => ({ url: PURCHASE_URL, method: "POST", data }),
      invalidatesTags: [
        { type: tagTypes.purchase, id: "LIST" },
        { type: tagTypes.product, id: "LIST" },
        { type: tagTypes.stockLedger, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAllSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetAllPurchasesQuery,
  useGetPurchaseQuery,
  useCreatePurchaseMutation,
} = purchaseApi;
