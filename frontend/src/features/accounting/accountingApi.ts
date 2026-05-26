import { baseApi } from "../../redux/api/baseApi";
import { tagTypes } from "../../redux/tag-types";

const ACCOUNT_URL = "/accounting/accounts";
const ACC_URL = "/accounting";

export const accountingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Accounts
    getAllAccounts: build.query({
      query: (params) => ({ url: ACCOUNT_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.account, id: "LIST" }],
    }),
    getAccount: build.query({
      query: (id: string) => ({ url: `${ACCOUNT_URL}/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: tagTypes.account, id }],
    }),
    getAccountSummary: build.query({
      query: () => ({ url: `${ACCOUNT_URL}/summary`, method: "GET" }),
      providesTags: [{ type: tagTypes.account, id: "SUMMARY" }],
    }),
    createAccount: build.mutation({
      query: (data) => ({ url: ACCOUNT_URL, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.account, id: "LIST" }, { type: tagTypes.account, id: "SUMMARY" }],
    }),
    updateAccount: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${ACCOUNT_URL}/${id}`, method: "PATCH", data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: tagTypes.account, id: arg.id },
        { type: tagTypes.account, id: "LIST" },
      ],
    }),
    deleteAccount: build.mutation({
      query: (id: string) => ({ url: `${ACCOUNT_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.account, id: "LIST" }],
    }),

    // Transactions
    recordIncome: build.mutation({
      query: (data) => ({ url: `${ACC_URL}/income`, method: "POST", data }),
      invalidatesTags: [
        { type: tagTypes.account, id: "LIST" },
        { type: tagTypes.account, id: "SUMMARY" },
        { type: tagTypes.transaction, id: "LIST" },
      ],
    }),
    recordExpense: build.mutation({
      query: (data) => ({ url: `${ACC_URL}/expense`, method: "POST", data }),
      invalidatesTags: [
        { type: tagTypes.account, id: "LIST" },
        { type: tagTypes.account, id: "SUMMARY" },
        { type: tagTypes.transaction, id: "LIST" },
      ],
    }),
    transferFunds: build.mutation({
      query: (data) => ({ url: `${ACC_URL}/transfer`, method: "POST", data }),
      invalidatesTags: [
        { type: tagTypes.account, id: "LIST" },
        { type: tagTypes.account, id: "SUMMARY" },
        { type: tagTypes.transaction, id: "LIST" },
      ],
    }),

    // Ledger
    getAccountLedger: build.query({
      query: (params) => ({ url: `${ACC_URL}/ledger`, method: "GET", params }),
      providesTags: [{ type: tagTypes.transaction, id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllAccountsQuery,
  useGetAccountQuery,
  useGetAccountSummaryQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useRecordIncomeMutation,
  useRecordExpenseMutation,
  useTransferFundsMutation,
  useGetAccountLedgerQuery,
} = accountingApi;
