import { baseApi } from "../../../redux/api/baseApi";
import { tagTypes } from "../../../redux/tag-types";

const COMMON_URL = "/inventory/categories";

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ✅ GET ALL
    getAllCategory: build.query({
      query: (params) => ({
        url: COMMON_URL,
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result?.data?.data
          ? [
              { type: tagTypes.category, id: "LIST" },
              ...result.data.data.map((item: any) => ({
                type: tagTypes.category,
                id: item.id,
              })),
            ]
          : [{ type: tagTypes.category, id: "LIST" }],
    }),

    // ✅ GET SINGLE
    getSingleCategory: build.query({
      query: (id: string) => ({
        url: `${COMMON_URL}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: tagTypes.category, id }],
    }),

    // ✅ CREATE
    createCategory: build.mutation({
      query: (formData: FormData) => ({
        url: COMMON_URL,
        method: "POST",
        data: formData,
        contentType: "multipart/form-data",
      }),
      invalidatesTags: [{ type: tagTypes.category, id: "LIST" }],
    }),

    // ✅ UPDATE
    updateCategory: build.mutation({
      query: ({ id, data }: { id: string; data: FormData }) => ({
        url: `${COMMON_URL}/${id}`,
        method: "PATCH",
        data,
        contentType: "multipart/form-data",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: tagTypes.category, id: arg.id },
        { type: tagTypes.category, id: "LIST" },
      ],
    }),

    // ✅ DELETE
    deleteCategory: build.mutation({
      query: (id: string) => ({
        url: `${COMMON_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: tagTypes.category, id },
        { type: tagTypes.category, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAllCategoryQuery,
  useGetSingleCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
