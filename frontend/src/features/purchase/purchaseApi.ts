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

    // Purchase Returns
    getPurchaseReturns: build.query({
      query: (params) => ({ url: `${PURCHASE_URL}/returns`, method: "GET", params }),
      providesTags: [{ type: tagTypes.purchaseReturn, id: "LIST" }],
    }),
    createPurchaseReturn: build.mutation({
      query: (data) => ({ url: `${PURCHASE_URL}/returns`, method: "POST", data }),
      invalidatesTags: [
        { type: tagTypes.purchaseReturn, id: "LIST" },
        { type: tagTypes.purchase, id: "LIST" },
      ],
    }),
    approvePurchaseReturn: build.mutation({
      query: (id: string) => ({ url: `${PURCHASE_URL}/returns/${id}/approve`, method: "PATCH" }),
      invalidatesTags: [{ type: tagTypes.purchaseReturn, id: "LIST" }],
    }),

    // Supplier Payment
    getSupplierDuePurchases: build.query({
      query: (supplierId: string) => ({ url: `${SUPPLIER_URL}/${supplierId}/due-purchases`, method: 'GET' }),
      providesTags: (result, error, id) => [{ type: tagTypes.supplier, id }, { type: tagTypes.purchase, id: 'DUE' }],
    }),
    paySupplier: build.mutation({
      query: ({ supplierId, data }: { supplierId: string; data: any }) => ({
        url: `${SUPPLIER_URL}/${supplierId}/pay`,
        method: 'POST',
        data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: tagTypes.supplier, id: arg.supplierId },
        { type: tagTypes.supplier, id: 'LIST' },
        { type: tagTypes.purchase, id: 'LIST' },
        { type: tagTypes.purchase, id: 'DUE' },
      ],
    }),

    // Supplier Ledger
    getSupplierLedger: build.query({
      query: ({ supplierId, ...params }: { supplierId: string; [k: string]: any }) => ({
        url: `${SUPPLIER_URL}/${supplierId}/ledger`,
        method: "GET",
        params,
      }),
      providesTags: (result, error, arg) => [{ type: tagTypes.supplier, id: arg.supplierId }],
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
  useGetPurchaseReturnsQuery,
  useCreatePurchaseReturnMutation,
  useApprovePurchaseReturnMutation,
  useGetSupplierDuePurchasesQuery,
  usePaySupplierMutation,
  useGetSupplierLedgerQuery,
} = purchaseApi;
