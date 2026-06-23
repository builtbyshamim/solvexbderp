import { baseApi } from "../../../redux/api/baseApi";
import { tagTypes } from "../../../redux/tag-types";

const COMMON_URL = "/inventory/products";

export const productApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ✅ GET ALL PRODUCTS
    getAllProducts: build.query({
      query: (params) => ({
        url: COMMON_URL,
        method: "GET",
        params,
      }),
      providesTags: [{ type: tagTypes.product, id: "LIST" }],
    }),

    // ✅ GET SINGLE PRODUCT
    getSingleProduct: build.query({
      query: (id: string) => ({
        url: `${COMMON_URL}/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: tagTypes.product, id }],
    }),

    // ✅ CREATE PRODUCT
    createProduct: build.mutation({
      query: (formData: any) => ({
        url: COMMON_URL,
        method: "POST",
        data: formData,
      }),
      invalidatesTags: [{ type: tagTypes.product, id: "LIST" }],
    }),

    // ✅ UPDATE PRODUCT
    updateProduct: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${COMMON_URL}/${id}`,
        method: "PATCH",
        data: data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: tagTypes.product, id: arg.id },
        { type: tagTypes.product, id: "LIST" },
      ],
    }),

    // ✅ DELETE PRODUCT
    deleteProduct: build.mutation({
      query: (id: string) => ({
        url: `${COMMON_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: tagTypes.product, id },
        { type: tagTypes.product, id: "LIST" },
      ],
    }),

    // GET /products/:productId/images
    getProductImages: build.query({
      query: (id) => ({
        url: `/products/images/${id}`,
        method: "GET",
      }),
      providesTags: [tagTypes.productImage],
    }),

    // POST /products/images/:productId  (multipart/form-data)
    uploadProductImages: build.mutation({
      query: ({ productId, formData }) => ({
        url: `/products/images/${productId}`,
        method: "POST",
        data: formData,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: tagTypes.productImage, id: productId },
      ],
    }),

    // DELETE /products/:productId/images/:imageId
    deleteProductImage: build.mutation({
      query: ({ imageId }) => ({
        url: `/products/images/${imageId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: tagTypes.productImage, id: productId },
      ],
    }),

    // PATCH /products/:productId/images/:imageId/thumbnail
    setThumbnail: build.mutation({
      query: ({ productId, imageId }) => ({
        url: `/products/images/${imageId}/thumbnail/${productId}`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: tagTypes.productImage, id: productId },
      ],
    }),

    reorderImages: build.mutation({
      query: ({ productId, orderedIds }:any) => ({
        url: `/products/images/reorder/${productId}`,
        method: "PATCH",
        data: { orderedIds },
      }),
    }),

    // ✅ GET PRODUCT DETAILS (sales/purchase history, stock ledger, summary)
    getProductDetails: build.query({
      query: (id: string) => ({
        url: `${COMMON_URL}/${id}/details`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: tagTypes.product, id: `details-${id}` }],
    }),

    // ✅ UPDATE OPENING STOCK
    updateOpeningStock: build.mutation({
      query: ({ id, openingQty }: { id: string; openingQty: number }) => ({
        url: `${COMMON_URL}/${id}/opening-stock`,
        method: "PATCH",
        data: { openingQty },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: tagTypes.product, id: arg.id },
        { type: tagTypes.product, id: `details-${arg.id}` },
        { type: tagTypes.product, id: "LIST" },
      ],
    }),

    // ✅ IMPORT PRODUCTS
    importProducts: build.mutation({
      query: (formData: FormData) => ({
        url: `${COMMON_URL}/import`,
        method: "POST",
        data: formData,
      }),
      invalidatesTags: [{ type: tagTypes.product, id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllProductsQuery,
  useGetSingleProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductImagesQuery,
  useUploadProductImagesMutation,
  useDeleteProductImageMutation,
  useSetThumbnailMutation,
  useReorderImagesMutation,
  useImportProductsMutation,
  useGetProductDetailsQuery,
  useUpdateOpeningStockMutation,
} = productApi;
