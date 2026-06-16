import { baseApi } from "../../redux/api/baseApi";
import { tagTypes } from "../../redux/tag-types";

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBusinessProfile: build.query({
      query: () => ({ url: "/business/me", method: "GET" }),
      providesTags: [{ type: tagTypes.business, id: "ME" }],
    }),
    updateBusinessProfile: build.mutation({
      query: (data) => ({ url: "/business/me", method: "PATCH", data }),
      invalidatesTags: [{ type: tagTypes.business, id: "ME" }],
    }),
    getSubscription: build.query({
      query: () => ({ url: "/subscription/current", method: "GET" }),
      providesTags: [{ type: tagTypes.business, id: "SUBSCRIPTION" }],
    }),
  }),
});

export const {
  useGetBusinessProfileQuery,
  useUpdateBusinessProfileMutation,
  useGetSubscriptionQuery,
} = settingsApi;
