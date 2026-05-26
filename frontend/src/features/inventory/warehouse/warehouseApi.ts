import { baseApi } from "../../../redux/api/baseApi";
import { tagTypes } from "../../../redux/tag-types";

const COMMON_URL = "/inventory/warehouses";

export const warehouseApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllWarehouse: build.query({
      query: (params) => ({ url: COMMON_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.warehouse, id: "LIST" }],
    }),
    createWarehouse: build.mutation({
      query: (data) => ({ url: COMMON_URL, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.warehouse, id: "LIST" }],
    }),
    updateWarehouse: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${COMMON_URL}/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: [{ type: tagTypes.warehouse, id: "LIST" }],
    }),
    setDefaultWarehouse: build.mutation({
      query: (id: string) => ({
        url: `${COMMON_URL}/${id}/set-default`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: tagTypes.warehouse, id: "LIST" }],
    }),
    deleteWarehouse: build.mutation({
      query: (id: string) => ({ url: `${COMMON_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.warehouse, id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllWarehouseQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useSetDefaultWarehouseMutation,
  useDeleteWarehouseMutation,
} = warehouseApi;
