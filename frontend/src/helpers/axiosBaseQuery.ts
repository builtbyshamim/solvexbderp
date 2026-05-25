import { instance as axiosInstance } from "./axiosInstance";
export const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: import.meta.env.VITE_PUBLIC_API_URL }) =>
  async ({ url, method, data, params, headers, contentType }: any) => {
    try {
      const isFormData = data instanceof FormData;
      const result = await axiosInstance({
        url: baseUrl + url,
        method,
        data,
        params,
        headers: {
          ...headers,
          ...(isFormData
            ? {} // FormData হলে Content-Type দেবেন না!
            : { "Content-Type": contentType || "application/json" }),
        },
      });

      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError;
      return {
        error: {
          status: err.statusCode || 500,
          message: err.message || "Network or server error!",
        },
      };
    }
  };
