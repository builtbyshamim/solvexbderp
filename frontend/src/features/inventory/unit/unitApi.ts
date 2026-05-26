import { baseApi } from "../../../redux/api/baseApi";
import { tagTypes } from "../../../redux/tag-types";

const COMMON_URL = "/inventory/units";

export const unitApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllUnit: build.query({
      query: (params) => ({ url: COMMON_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.unit, id: "LIST" }],
    }),
    createUnit: build.mutation({
      query: (data) => ({ url: COMMON_URL, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.unit, id: "LIST" }],
    }),
    updateUnit: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${COMMON_URL}/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: tagTypes.unit, id: arg.id },
        { type: tagTypes.unit, id: "LIST" },
      ],
    }),
    deleteUnit: build.mutation({
      query: (id: string) => ({ url: `${COMMON_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.unit, id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllUnitQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
} = unitApi;
