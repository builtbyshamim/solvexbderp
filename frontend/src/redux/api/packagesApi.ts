import { tagTypes } from '../tag-types';
import { baseApi } from './baseApi';

const URL = '/packages';

export const packagesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPublicPackages: build.query<{ data: Package[] }, void>({
      query: () => ({ url: `${URL}/public`, method: 'GET' }),
      providesTags: [tagTypes.packages],
    }),
    getAllPackages: build.query<{ data: Package[] }, void>({
      query: () => ({ url: URL, method: 'GET' }),
      providesTags: [tagTypes.packages],
    }),
    createPackage: build.mutation({
      query: (data) => ({ url: URL, method: 'POST', data }),
      invalidatesTags: [tagTypes.packages],
    }),
    updatePackage: build.mutation({
      query: ({ id, ...data }: { id: string;[k: string]: any }) => ({
        url: `${URL}/${id}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: [tagTypes.packages],
    }),
    deletePackage: build.mutation({
      query: (id: string) => ({ url: `${URL}/${id}`, method: 'DELETE' }),
      invalidatesTags: [tagTypes.packages],
    }),
  }),
});

export const {
  useGetPublicPackagesQuery,
  useGetAllPackagesQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
} = packagesApi;

export interface Package {
  id: string;
  name: string;
  badge?: string;
  highlight: boolean;
  isEnterprise: boolean;
  isActive: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  maxUsers: number;        // -1 = unlimited
  maxProducts: number;     // -1 = unlimited
  maxWarehouses: number;   // -1 = unlimited
  features: string[];
  sortOrder: number;
}
