import { baseApi } from '../../redux/api/baseApi.js';
import { tagTypes } from '../../redux/tag-types.js';

const USER_URL = '/users';

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllUser: build.query({
      query: (params) => {
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
        );
        return { url: USER_URL, method: 'GET', params: cleanParams };
      },
      providesTags: [tagTypes.users],
    }),

    getUserById: build.query({
      query: (id: string) => ({ url: `${USER_URL}/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: tagTypes.users, id }],
    }),

    getRolePermissions: build.query({
      query: () => ({ url: `${USER_URL}/permissions/roles`, method: 'GET' }),
    }),

    inviteUser: build.mutation({
      query: (formData) => ({ url: `${USER_URL}/invite`, method: 'POST', data: formData }),
      invalidatesTags: [tagTypes.users],
    }),

    updateUserRole: build.mutation({
      query: ({ id, role }: { id: string; role: string }) => ({
        url: `${USER_URL}/${id}/role`,
        method: 'PATCH',
        data: { role },
      }),
      invalidatesTags: [tagTypes.users],
    }),

    updateUserPermissions: build.mutation({
      query: ({ id, permissions }: { id: string; permissions: string[] }) => ({
        url: `${USER_URL}/${id}/permissions`,
        method: 'PATCH',
        data: { permissions },
      }),
      invalidatesTags: [tagTypes.users],
    }),

    deleteUser: build.mutation({
      query: (id: string) => ({ url: `${USER_URL}/${id}`, method: 'DELETE' }),
      invalidatesTags: [tagTypes.users],
    }),

    // Legacy aliases kept for backward compat
    createCustomer: build.mutation({
      query: (formData) => ({ url: USER_URL, method: 'POST', data: formData }),
      invalidatesTags: [tagTypes.users],
    }),

    deleteCustomer: build.mutation({
      query: (id: string) => ({ url: `${USER_URL}/${id}`, method: 'DELETE' }),
      invalidatesTags: [tagTypes.users],
    }),

    updateCustomer: build.mutation({
      query: ({ id, ...data }: { id: string; [key: string]: unknown }) => ({
        url: `${USER_URL}/${id}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: [tagTypes.users],
    }),
  }),
});

export const {
  useGetAllUserQuery,
  useGetUserByIdQuery,
  useGetRolePermissionsQuery,
  useInviteUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserPermissionsMutation,
  useDeleteUserMutation,
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
} = userApi;
