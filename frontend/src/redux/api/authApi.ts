import { tagTypes } from "../tag-types";
import { baseApi } from "./baseApi";
const AUTH_URL = "/auth";
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    adminLogin: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/admin-login`,
        method: "POST",
        data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),
    registration: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/register`,
        method: "POST",
        data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),
    createCompany: build.mutation({
      query: (formData) => ({
        url: `${AUTH_URL}/create-company`,
        method: "POST",
        data: formData,
        contentType: "multipart/form-data",
      }),
      invalidatesTags: [tagTypes.auth],
    }),

    fetchMe: build.query({
      query: () => ({
        url: `/users/profile`,
        method: "GET",
      }),
      providesTags: [tagTypes.auth],
    }),

    updateProfile: build.mutation({
      query: (formData) => ({
        url: `${AUTH_URL}/update-profile`,
        method: "POST",
        data: formData,
        contentType: "multipart/form-data",
      }),
      invalidatesTags: [tagTypes.auth],
    }),

    forgotPassword: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/forgot-password`,
        method: "POST",
        data: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),
    verifyOtp: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/verify-otp`,
        method: "POST",
        data: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),
    setNewPassword: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/reset-password`,
        method: "POST",
        data: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),
    changeNewPassword: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/change-password`,
        method: "POST",
        data: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),
    logout: build.mutation({
      query: () => ({
        url: `${AUTH_URL}/logout`,
        method: "POST",
      }),
      invalidatesTags: [tagTypes.auth],
    }),

    mobileSendOtp: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/mobile/send-otp`,
        method: "POST",
        data,
      }),
    }),

    mobileVerifyOtp: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/mobile/verify-otp`,
        method: "POST",
        data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),

    mobileRegister: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/mobile/register`,
        method: "POST",
        data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),
  }),
});

export const {
  useAdminLoginMutation,
  useFetchMeQuery,
  useUpdateProfileMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useSetNewPasswordMutation,
  useCreateCompanyMutation,
  useChangeNewPasswordMutation,
  useLogoutMutation,
  useMobileSendOtpMutation,
  useMobileVerifyOtpMutation,
  useMobileRegisterMutation,
} = authApi;
