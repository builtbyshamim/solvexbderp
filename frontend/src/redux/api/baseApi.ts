import { createApi } from "@reduxjs/toolkit/query/react";
import { tagTypesList } from "../tag-types.ts";
import { axiosBaseQuery } from "../../helpers/axiosBaseQuery.ts";
export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: axiosBaseQuery({
    baseUrl: `${import.meta.env.VITE_PUBLIC_API_URL}/api/v1`,
  }),

  tagTypes: tagTypesList,
  endpoints: () => ({}),
});
