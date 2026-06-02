import { baseApi } from "../../../redux/api/baseApi";
import { tagTypes } from "../../../redux/tag-types";

const LOCATIONS_URL = "/inventory/stock/locations";

export const stockLocationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStockLocations: build.query({
      query: () => ({ url: LOCATIONS_URL, method: "GET" }),
      providesTags: [{ type: tagTypes.warehouse, id: "LIST" }],
    }),
  }),
});

export const { useGetStockLocationsQuery } = stockLocationApi;
