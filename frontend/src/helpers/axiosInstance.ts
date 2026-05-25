/* eslint-disable no-undef */
import axios from "axios";
import {
  accessTokenKey,
  accessTokenTTL,
  refreshTokenKey,
  refreshTokenTTL,
} from "../contents/token";

// Cookie set করার helper function
const setTokenCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

// Cookie থেকে token পড়ার helper function
const getTokenFromCookie = (name: string): string | null => {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)"),
    );
    return match ? match[2] : null;
  }
  return null;
};

// Cookie delete করার helper function
const deleteTokenCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Axios instance তৈরি
const instance = axios.create({
  timeout: 60000,
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor — প্রতিটি রিকোয়েস্ট পাঠানোর আগে cookie থেকে token নিয়ে Authorization header সেট করে
instance.interceptors.request.use(
  (config) => {
    const token = getTokenFromCookie(accessTokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor (login response থেকে token নিয়ে cookie তে save করা + error handle + token refresh)
instance.interceptors.response.use(
  (response) => {
    // যদি login বা admin-login বা refresh endpoint থেকে response আসে
    const isAuthEndpoint =
      response.config.url?.includes("/auth/admin-login") ||
      response.config.url?.includes("/auth/refresh");

    if (isAuthEndpoint && response.data?.data) {
      const { accessToken, refreshToken } = response.data.data;
      // Access token cookie তে save করা (15 minutes)
      if (accessToken) {
        setTokenCookie(accessTokenKey, accessToken, accessTokenTTL); // 15 minutes in days
      }

      // Refresh token cookie তে save করা (7 days)
      if (refreshToken) {
        setTokenCookie(refreshTokenKey, refreshToken, 7);
      }
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const skipRefreshUrls = [
      "/auth/admin-login",
      "/auth/register",
      "/auth/refresh",
    ];
    // If error is 401 and we haven't already tried to refresh the token
    if (
      error?.response?.status === 401 &&
      !originalRequest._retry &&
      !skipRefreshUrls.some((url) => originalRequest.url.includes(url))
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return instance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getTokenFromCookie(refreshTokenKey);

      if (!refreshToken) {
        // No refresh token available, redirect to login
        isRefreshing = false;
        processQueue(error, null);

        // Clear all cookies
        deleteTokenCookie(accessTokenKey);
        deleteTokenCookie(refreshTokenKey);
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Call refresh token endpoint
        const response = await axios.post(
          `${import.meta.env.VITE_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Save new tokens in cookies
        if (accessToken) {
          setTokenCookie(accessTokenKey, accessToken, accessTokenTTL); // 15 minutes
        }
        if (newRefreshToken) {
          setTokenCookie(refreshTokenKey, newRefreshToken, refreshTokenTTL); // 7 days
        }

        // Process queued requests
        isRefreshing = false;
        processQueue(null, accessToken);

        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return instance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        isRefreshing = false;
        processQueue(refreshError, null);

        // Clear all cookies and localStorage
        deleteTokenCookie(accessTokenKey);
        deleteTokenCookie(refreshTokenKey);
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    // For all other errors, format and reject
    const responseObject = {
      statusCode: error?.response?.status || 500,
      message: error?.response?.data?.message || "Something went wrong!",
    };
    return Promise.reject(responseObject);
  },
);

export { instance };

// Export helper functions for manual use if needed
export const tokenHelper = {
  getAccessToken: () => getTokenFromCookie(accessTokenKey),
  getRefreshToken: () => getTokenFromCookie(refreshTokenKey),
  setAccessToken: (token: string) =>
    setTokenCookie(accessTokenKey, token, accessTokenTTL),
  setRefreshToken: (token: string) =>
    setTokenCookie(refreshTokenKey, token, refreshTokenTTL),
  clearTokens: () => {
    deleteTokenCookie(accessTokenKey);
    deleteTokenCookie(refreshTokenKey);
  },
};
