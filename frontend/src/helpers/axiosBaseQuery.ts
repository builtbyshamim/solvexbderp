import { instance as axiosInstance } from './axiosInstance';
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
            : { 'Content-Type': contentType || 'application/json' }),
        },
      });
      // Unwrap the backend's TransformInterceptor envelope { success, data, ... }
      return { data: result.data?.data ?? result.data };
    } catch (axiosError: any) {
      return {
        error: {
          status: axiosError?.statusCode || 500,
          data: {
            message: axiosError?.message || 'Something went wrong!',
          },
        },
      };
    }
  };
