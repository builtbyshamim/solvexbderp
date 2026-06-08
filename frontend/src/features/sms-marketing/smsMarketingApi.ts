import { baseApi } from "../../redux/api/baseApi";
import { tagTypes } from "../../redux/tag-types";

const SMS = "/sms-marketing";

export const smsMarketingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Stats ────────────────────────────────────────────────────────────────
    getSmsStats: build.query({
      query: () => ({ url: `${SMS}/stats`, method: "GET" }),
      providesTags: [{ type: tagTypes.smsCampaign, id: "STATS" }, { type: tagTypes.smsLog, id: "STATS" }],
    }),

    // ── Templates ────────────────────────────────────────────────────────────
    getSmsTemplates: build.query({
      query: (params) => ({ url: `${SMS}/templates`, method: "GET", params }),
      providesTags: [{ type: tagTypes.smsTemplate, id: "LIST" }],
    }),
    getSmsTemplate: build.query({
      query: (id: string) => ({ url: `${SMS}/templates/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: tagTypes.smsTemplate, id }],
    }),
    createSmsTemplate: build.mutation({
      query: (data) => ({ url: `${SMS}/templates`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.smsTemplate, id: "LIST" }, { type: tagTypes.smsCampaign, id: "STATS" }],
    }),
    updateSmsTemplate: build.mutation({
      query: ({ id, ...data }: { id: string; [key: string]: any }) => ({ url: `${SMS}/templates/${id}`, method: "PATCH", data }),
      invalidatesTags: (result, error, arg) => [{ type: tagTypes.smsTemplate, id: arg.id }, { type: tagTypes.smsTemplate, id: "LIST" }],
    }),
    deleteSmsTemplate: build.mutation({
      query: (id: string) => ({ url: `${SMS}/templates/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.smsTemplate, id: "LIST" }],
    }),

    // ── Groups ───────────────────────────────────────────────────────────────
    getSmsGroups: build.query({
      query: (params) => ({ url: `${SMS}/groups`, method: "GET", params }),
      providesTags: [{ type: tagTypes.smsCampaign, id: "GROUPS" }],
    }),
    getSmsGroup: build.query({
      query: (id: string) => ({ url: `${SMS}/groups/${id}`, method: "GET" }),
    }),
    createSmsGroup: build.mutation({
      query: (data) => ({ url: `${SMS}/groups`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "GROUPS" }, { type: tagTypes.smsCampaign, id: "STATS" }],
    }),
    updateSmsGroup: build.mutation({
      query: ({ id, ...data }: { id: string; [key: string]: any }) => ({ url: `${SMS}/groups/${id}`, method: "PATCH", data }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "GROUPS" }],
    }),
    deleteSmsGroup: build.mutation({
      query: (id: string) => ({ url: `${SMS}/groups/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "GROUPS" }, { type: tagTypes.smsCampaign, id: "STATS" }],
    }),
    getGroupMembers: build.query({
      query: ({ groupId, ...params }: { groupId: string; [key: string]: any }) => ({ url: `${SMS}/groups/${groupId}/members`, method: "GET", params }),
      providesTags: (result, error, arg) => [{ type: tagTypes.smsCampaign, id: `MEMBERS-${arg.groupId}` }],
    }),
    addGroupMembers: build.mutation({
      query: ({ groupId, members }: { groupId: string; members: any[] }) => ({ url: `${SMS}/groups/${groupId}/members`, method: "POST", data: { members } }),
      invalidatesTags: (result, error, arg) => [
        { type: tagTypes.smsCampaign, id: `MEMBERS-${arg.groupId}` },
        { type: tagTypes.smsCampaign, id: "GROUPS" },
      ],
    }),
    removeGroupMember: build.mutation({
      query: ({ groupId, memberId }: { groupId: string; memberId: string }) => ({ url: `${SMS}/groups/${groupId}/members/${memberId}`, method: "DELETE" }),
      invalidatesTags: (result, error, arg) => [{ type: tagTypes.smsCampaign, id: `MEMBERS-${arg.groupId}` }, { type: tagTypes.smsCampaign, id: "GROUPS" }],
    }),
    importCustomersToGroup: build.mutation({
      query: (groupId: string) => ({ url: `${SMS}/groups/${groupId}/import-customers`, method: "POST" }),
      invalidatesTags: (result, error, groupId) => [{ type: tagTypes.smsCampaign, id: `MEMBERS-${groupId}` }, { type: tagTypes.smsCampaign, id: "GROUPS" }],
    }),

    // ── Campaigns ────────────────────────────────────────────────────────────
    getSmsCampaigns: build.query({
      query: (params) => ({ url: `${SMS}/campaigns`, method: "GET", params }),
      providesTags: [{ type: tagTypes.smsCampaign, id: "LIST" }],
    }),
    getSmsCampaign: build.query({
      query: (id: string) => ({ url: `${SMS}/campaigns/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: tagTypes.smsCampaign, id }],
    }),
    createSmsCampaign: build.mutation({
      query: (data) => ({ url: `${SMS}/campaigns`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "LIST" }, { type: tagTypes.smsCampaign, id: "STATS" }],
    }),
    updateSmsCampaign: build.mutation({
      query: ({ id, ...data }: { id: string; [key: string]: any }) => ({ url: `${SMS}/campaigns/${id}`, method: "PATCH", data }),
      invalidatesTags: (result, error, arg) => [{ type: tagTypes.smsCampaign, id: arg.id }, { type: tagTypes.smsCampaign, id: "LIST" }],
    }),
    sendSmsCampaign: build.mutation({
      query: (id: string) => ({ url: `${SMS}/campaigns/${id}/send`, method: "POST" }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "LIST" }, { type: tagTypes.smsCampaign, id: "STATS" }, { type: tagTypes.smsLog, id: "LIST" }, { type: tagTypes.smsLog, id: "STATS" }],
    }),
    deleteSmsCampaign: build.mutation({
      query: (id: string) => ({ url: `${SMS}/campaigns/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "LIST" }, { type: tagTypes.smsCampaign, id: "STATS" }],
    }),

    // ── Quick Send ───────────────────────────────────────────────────────────
    quickSendSms: build.mutation({
      query: (data) => ({ url: `${SMS}/send`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.smsLog, id: "LIST" }, { type: tagTypes.smsLog, id: "STATS" }],
    }),

    // ── Logs ─────────────────────────────────────────────────────────────────
    getSmsLogs: build.query({
      query: (params) => ({ url: `${SMS}/logs`, method: "GET", params }),
      providesTags: [{ type: tagTypes.smsLog, id: "LIST" }],
    }),

    // ── Configuration ─────────────────────────────────────────────────────────
    getSmsConfig: build.query({
      query: () => ({ url: `${SMS}/config`, method: "GET" }),
      providesTags: [{ type: tagTypes.smsCampaign, id: "CONFIG" }],
    }),
    saveSmsConfig: build.mutation({
      query: (data) => ({ url: `${SMS}/config`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "CONFIG" }],
    }),
    testSms: build.mutation({
      query: (data) => ({ url: `${SMS}/config/test`, method: "POST", data }),
    }),

    // ── Packages & Credits ────────────────────────────────────────────────────
    getSmsPackages: build.query({
      query: () => ({ url: `${SMS}/packages`, method: "GET" }),
      providesTags: [{ type: tagTypes.smsCampaign, id: "PACKAGES" }],
    }),
    getSmsCredits: build.query({
      query: () => ({ url: `${SMS}/credits`, method: "GET" }),
      providesTags: [{ type: tagTypes.smsCampaign, id: "CREDITS" }],
    }),
    purchasePackage: build.mutation({
      query: (data) => ({ url: `${SMS}/credits/purchase`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "CREDITS" }, { type: tagTypes.smsCampaign, id: "STATS" }],
    }),

    // ── Due Reminder ──────────────────────────────────────────────────────────
    getDueReminders: build.query({
      query: () => ({ url: `${SMS}/due-reminders`, method: "GET" }),
      providesTags: [{ type: tagTypes.smsCampaign, id: "REMINDERS" }],
    }),
    createDueReminder: build.mutation({
      query: (data) => ({ url: `${SMS}/due-reminders`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "REMINDERS" }],
    }),
    updateDueReminder: build.mutation({
      query: ({ id, ...data }: { id: string; [key: string]: any }) => ({ url: `${SMS}/due-reminders/${id}`, method: "PATCH", data }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "REMINDERS" }],
    }),
    toggleDueReminder: build.mutation({
      query: (id: string) => ({ url: `${SMS}/due-reminders/${id}/toggle`, method: "POST" }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "REMINDERS" }],
    }),
    sendDueReminder: build.mutation({
      query: (id: string) => ({ url: `${SMS}/due-reminders/${id}/send`, method: "POST" }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "REMINDERS" }, { type: tagTypes.smsLog, id: "STATS" }],
    }),
    deleteDueReminder: build.mutation({
      query: (id: string) => ({ url: `${SMS}/due-reminders/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "REMINDERS" }],
    }),
    getDueReminderLogs: build.query({
      query: (params) => ({ url: `${SMS}/due-reminder-logs`, method: "GET", params }),
      providesTags: [{ type: tagTypes.smsLog, id: "REMINDER-LOGS" }],
    }),

    // ── Transactional SMS ─────────────────────────────────────────────────────
    getTransactionalSmsSettings: build.query({
      query: () => ({ url: `${SMS}/transactional-settings`, method: "GET" }),
      providesTags: [{ type: tagTypes.smsCampaign, id: "TRANSACTIONAL" }],
    }),
    saveTransactionalSmsSettings: build.mutation({
      query: (data) => ({ url: `${SMS}/transactional-settings`, method: "PUT", data }),
      invalidatesTags: [{ type: tagTypes.smsCampaign, id: "TRANSACTIONAL" }],
    }),
    previewTransactionalSms: build.mutation({
      query: (data: { template: string }) => ({ url: `${SMS}/transactional-settings/preview`, method: "POST", data }),
    }),
  }),
});

export const {
  useGetSmsStatsQuery,
  useGetSmsTemplatesQuery,
  useGetSmsTemplateQuery,
  useCreateSmsTemplateMutation,
  useUpdateSmsTemplateMutation,
  useDeleteSmsTemplateMutation,
  useGetSmsGroupsQuery,
  useGetSmsGroupQuery,
  useCreateSmsGroupMutation,
  useUpdateSmsGroupMutation,
  useDeleteSmsGroupMutation,
  useGetGroupMembersQuery,
  useAddGroupMembersMutation,
  useRemoveGroupMemberMutation,
  useImportCustomersToGroupMutation,
  useGetSmsCampaignsQuery,
  useGetSmsCampaignQuery,
  useCreateSmsCampaignMutation,
  useUpdateSmsCampaignMutation,
  useSendSmsCampaignMutation,
  useDeleteSmsCampaignMutation,
  useQuickSendSmsMutation,
  useGetSmsLogsQuery,
  useGetSmsConfigQuery,
  useSaveSmsConfigMutation,
  useTestSmsMutation,
  useGetSmsPackagesQuery,
  useGetSmsCreditsQuery,
  usePurchasePackageMutation,
  useGetDueRemindersQuery,
  useCreateDueReminderMutation,
  useUpdateDueReminderMutation,
  useToggleDueReminderMutation,
  useSendDueReminderMutation,
  useDeleteDueReminderMutation,
  useGetDueReminderLogsQuery,
  useGetTransactionalSmsSettingsQuery,
  useSaveTransactionalSmsSettingsMutation,
  usePreviewTransactionalSmsMutation,
} = smsMarketingApi;
