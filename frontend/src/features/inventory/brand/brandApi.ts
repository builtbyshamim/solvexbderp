import { baseApi } from "../../../redux/api/baseApi";
import { tagTypes } from "../../../redux/tag-types";
const COMMON_URL = "/brands";
export const brandApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ✅ GET ALL
    getAllBrand: build.query({
      query: (params) => ({
        url: COMMON_URL,
        method: "GET",
        params,
      }),
      providesTags: [tagTypes.brand],
    }),

    // ✅ GET SINGLE
    getSingleBrand: build.query({
      query: (id: string) => ({
        url: `${COMMON_URL}/${id}`,
        method: "GET",
      }),
      providesTags: [tagTypes.brand],
    }),

    // ✅ CREATE
    createBrand: build.mutation({
      query: (formData: FormData) => ({
        url: COMMON_URL,
        method: "POST",
        data: formData,
        contentType: "multipart/form-data",
      }),
      invalidatesTags: [tagTypes.brand],
    }),

    // ✅ UPDATE
    updateBrand: build.mutation({
      query: ({ id, data }: { id: string; data: FormData }) => ({
        url: `${COMMON_URL}/${id}`,
        method: "PATCH",
        data,
        contentType: "multipart/form-data",
      }),
      invalidatesTags: [tagTypes.brand],
    }),

    // ✅ DELETE
    deleteBrand: build.mutation({
      query: (id: string) => ({
        url: `${COMMON_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.brand],
    }),
  }),
});

export const {
  useGetAllBrandQuery,
  useGetSingleBrandQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandApi;
