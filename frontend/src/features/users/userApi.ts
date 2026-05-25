import { baseApi } from '../../redux/api/baseApi.js';
import { tagTypes } from '../../redux/tag-types.js';

const USER_URL = '/users';

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ✅ GET all Users — empty strings stripped before sending
    getAllUser: build.query({
      query: (params) => {
        // Remove keys with empty string / null / undefined values
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
        );
        return {
          url: USER_URL,
          method: 'GET',
          params: cleanParams,
        };
      },
      providesTags: [tagTypes.users],
    }),

    // ✅ CREATE a new User
    createCustomer: build.mutation({
      query: (formData) => ({
        url: USER_URL,
        method: 'POST',
        data: formData,
      }),
      invalidatesTags: [tagTypes.users],
    }),

    // ✅ DELETE a User
    deleteCustomer: build.mutation({
      query: (id) => ({
        url: `${USER_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [tagTypes.users],
    }),

    // ✅ UPDATE a User
    updateCustomer: build.mutation({
      query: ({ id, ...data }) => ({
        url: `${USER_URL}/${id}`,
        method: 'PATCH',
        data: data,
      }),
      invalidatesTags: [tagTypes.users],
    }),
  }),
});

export const {
  useGetAllUserQuery,
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
} = userApi;
