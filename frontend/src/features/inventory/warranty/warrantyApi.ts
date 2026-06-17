import { baseApi } from "../../../redux/api/baseApi";
import { tagTypes } from "../../../redux/tag-types";

const COMMON_URL = "/inventory/warranties";

export const warrantyApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllWarranty: build.query({
      query: (params) => ({ url: COMMON_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.warranty, id: "LIST" }],
    }),
    createWarranty: build.mutation({
      query: (data) => ({ url: COMMON_URL, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.warranty, id: "LIST" }],
    }),
    updateWarranty: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${COMMON_URL}/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: tagTypes.warranty, id: arg.id },
        { type: tagTypes.warranty, id: "LIST" },
      ],
    }),
    deleteWarranty: build.mutation({
      query: (id: string) => ({ url: `${COMMON_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.warranty, id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllWarrantyQuery,
  useCreateWarrantyMutation,
  useUpdateWarrantyMutation,
  useDeleteWarrantyMutation,
} = warrantyApi;
