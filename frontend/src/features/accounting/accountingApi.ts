import { baseApi } from "../../redux/api/baseApi";
import { tagTypes } from "../../redux/tag-types";

const ACCOUNT_URL = "/accounting/accounts";
const CAT_URL = "/accounting/categories";
const ACC_URL = "/accounting";

export const accountingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Accounting Categories ─────────────────────────────────────────────
    getAccountingCategories: build.query({
      query: (params?: { type?: string }) => ({ url: CAT_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.account, id: "CATEGORIES" }],
    }),
    createAccountingCategory: build.mutation({
      query: (data) => ({ url: CAT_URL, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.account, id: "CATEGORIES" }],
    }),
    updateAccountingCategory: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${CAT_URL}/${id}`, method: "PATCH", data,
      }),
      invalidatesTags: [{ type: tagTypes.account, id: "CATEGORIES" }],
    }),
    deleteAccountingCategory: build.mutation({
      query: (id: string) => ({ url: `${CAT_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.account, id: "CATEGORIES" }],
    }),

    // ── Accounts ─────────────────────────────────────────────────────────
    getAllAccounts: build.query({
      query: (params) => ({ url: ACCOUNT_URL, method: "GET", params }),
      providesTags: [{ type: tagTypes.account, id: "LIST" }],
    }),
    getAccount: build.query({
      query: (id: string) => ({ url: `${ACCOUNT_URL}/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: tagTypes.account, id }],
    }),
    getAccountSummary: build.query({
      query: () => ({ url: `${ACCOUNT_URL}/summary`, method: "GET" }),
      providesTags: [{ type: tagTypes.account, id: "SUMMARY" }],
    }),
    createAccount: build.mutation({
      query: (data) => ({ url: ACCOUNT_URL, method: "POST", data }),
      invalidatesTags: [
        { type: tagTypes.account, id: "LIST" },
        { type: tagTypes.account, id: "SUMMARY" },
      ],
    }),
    updateAccount: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${ACCOUNT_URL}/${id}`, method: "PATCH", data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: tagTypes.account, id: arg.id },
        { type: tagTypes.account, id: "LIST" },
      ],
    }),
    deleteAccount: build.mutation({
      query: (id: string) => ({ url: `${ACCOUNT_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.account, id: "LIST" }],
    }),

    // ── Income ────────────────────────────────────────────────────────────
    recordIncome: build.mutation({
      query: (data) => ({ url: `${ACC_URL}/income`, method: "POST", data }),
      invalidatesTags: [
        { type: tagTypes.account, id: "LIST" },
        { type: tagTypes.account, id: "SUMMARY" },
        { type: tagTypes.transaction, id: "LIST" },
        { type: tagTypes.transaction, id: "INCOME" },
      ],
    }),
    getIncomes: build.query({
      query: (params) => ({ url: `${ACC_URL}/income`, method: "GET", params }),
      providesTags: [{ type: tagTypes.transaction, id: "INCOME" }],
    }),

    // ── Expense ───────────────────────────────────────────────────────────
    recordExpense: build.mutation({
      query: (data) => ({ url: `${ACC_URL}/expense`, method: "POST", data }),
      invalidatesTags: [
        { type: tagTypes.account, id: "LIST" },
        { type: tagTypes.account, id: "SUMMARY" },
        { type: tagTypes.transaction, id: "LIST" },
        { type: tagTypes.transaction, id: "EXPENSE" },
      ],
    }),
    getExpenses: build.query({
      query: (params) => ({ url: `${ACC_URL}/expense`, method: "GET", params }),
      providesTags: [{ type: tagTypes.transaction, id: "EXPENSE" }],
    }),

    // ── Transfer ──────────────────────────────────────────────────────────
    transferFunds: build.mutation({
      query: (data) => ({ url: `${ACC_URL}/transfer`, method: "POST", data }),
      invalidatesTags: [
        { type: tagTypes.account, id: "LIST" },
        { type: tagTypes.account, id: "SUMMARY" },
        { type: tagTypes.transaction, id: "LIST" },
      ],
    }),

    // ── Transactions ──────────────────────────────────────────────────────
    getTransactions: build.query({
      query: (params) => ({ url: `${ACC_URL}/transactions`, method: "GET", params }),
      providesTags: [{ type: tagTypes.transaction, id: "LIST" }],
    }),
    deleteTransaction: build.mutation({
      query: (id: string) => ({ url: `${ACC_URL}/transactions/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: tagTypes.account, id: "LIST" },
        { type: tagTypes.account, id: "SUMMARY" },
        { type: tagTypes.transaction, id: "LIST" },
        { type: tagTypes.transaction, id: "INCOME" },
        { type: tagTypes.transaction, id: "EXPENSE" },
      ],
    }),

    // ── Ledger ────────────────────────────────────────────────────────────
    getAccountLedger: build.query({
      query: (params) => ({ url: `${ACC_URL}/ledger`, method: "GET", params }),
      providesTags: [{ type: tagTypes.transaction, id: "LEDGER" }],
    }),

    // ── Reports ───────────────────────────────────────────────────────────
    getProfitLoss: build.query({
      query: (params) => ({ url: `${ACC_URL}/reports/profit-loss`, method: "GET", params }),
      providesTags: [{ type: tagTypes.report, id: "PL" }],
    }),
    getBalanceSheet: build.query({
      query: () => ({ url: `${ACC_URL}/reports/balance-sheet`, method: "GET" }),
      providesTags: [{ type: tagTypes.report, id: "BS" }],
    }),
    getTrialBalance: build.query({
      query: () => ({ url: `${ACC_URL}/reports/trial-balance`, method: "GET" }),
      providesTags: [{ type: tagTypes.report, id: "TB" }],
    }),
    getCashFlow: build.query({
      query: (params) => ({ url: `${ACC_URL}/reports/cash-flow`, method: "GET", params }),
      providesTags: [{ type: tagTypes.report, id: "CF" }],
    }),
  }),
});

export const {
  useGetAccountingCategoriesQuery,
  useCreateAccountingCategoryMutation,
  useUpdateAccountingCategoryMutation,
  useDeleteAccountingCategoryMutation,
  useGetAllAccountsQuery,
  useGetAccountQuery,
  useGetAccountSummaryQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useRecordIncomeMutation,
  useGetIncomesQuery,
  useRecordExpenseMutation,
  useGetExpensesQuery,
  useTransferFundsMutation,
  useGetTransactionsQuery,
  useDeleteTransactionMutation,
  useGetAccountLedgerQuery,
  useGetProfitLossQuery,
  useGetBalanceSheetQuery,
  useGetTrialBalanceQuery,
  useGetCashFlowQuery,
} = accountingApi;
