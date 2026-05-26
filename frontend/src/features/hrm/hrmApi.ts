import { baseApi } from "../../redux/api/baseApi";
import { tagTypes } from "../../redux/tag-types";

const HRM_URL = "/hrm";

export const hrmApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Employees
    getAllEmployees: build.query({
      query: (params) => ({ url: `${HRM_URL}/employees`, method: "GET", params }),
      providesTags: [{ type: tagTypes.employee, id: "LIST" }],
    }),
    getEmployee: build.query({
      query: (id: string) => ({ url: `${HRM_URL}/employees/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: tagTypes.employee, id }],
    }),
    createEmployee: build.mutation({
      query: (data) => ({ url: `${HRM_URL}/employees`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.employee, id: "LIST" }],
    }),
    updateEmployee: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${HRM_URL}/employees/${id}`, method: "PATCH", data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: tagTypes.employee, id: arg.id },
        { type: tagTypes.employee, id: "LIST" },
      ],
    }),
    terminateEmployee: build.mutation({
      query: (id: string) => ({ url: `${HRM_URL}/employees/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.employee, id: "LIST" }],
    }),

    // Attendance
    getAttendance: build.query({
      query: (params) => ({ url: `${HRM_URL}/attendance`, method: "GET", params }),
      providesTags: [{ type: tagTypes.attendance, id: "LIST" }],
    }),
    createAttendance: build.mutation({
      query: (data) => ({ url: `${HRM_URL}/attendance`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.attendance, id: "LIST" }],
    }),
    getAttendanceSummary: build.query({
      query: ({ employeeId, month, year }: { employeeId: string; month: number; year: number }) => ({
        url: `${HRM_URL}/attendance/summary/${employeeId}`,
        method: "GET",
        params: { month, year },
      }),
      providesTags: (result, error, arg) => [{ type: tagTypes.attendance, id: arg.employeeId }],
    }),

    // Leave
    getAllLeaves: build.query({
      query: (params) => ({ url: `${HRM_URL}/leaves`, method: "GET", params }),
      providesTags: [{ type: tagTypes.payroll, id: "LEAVE_LIST" }],
    }),
    createLeave: build.mutation({
      query: (data) => ({ url: `${HRM_URL}/leaves`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.payroll, id: "LEAVE_LIST" }],
    }),
    updateLeaveStatus: build.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${HRM_URL}/leaves/${id}/status`, method: "PATCH", data,
      }),
      invalidatesTags: [{ type: tagTypes.payroll, id: "LEAVE_LIST" }],
    }),

    // Payroll
    getAllPayrolls: build.query({
      query: (params) => ({ url: `${HRM_URL}/payroll`, method: "GET", params }),
      providesTags: [{ type: tagTypes.payroll, id: "LIST" }],
    }),
    generatePayroll: build.mutation({
      query: (data) => ({ url: `${HRM_URL}/payroll/generate`, method: "POST", data }),
      invalidatesTags: [{ type: tagTypes.payroll, id: "LIST" }],
    }),
    approvePayroll: build.mutation({
      query: (id: string) => ({ url: `${HRM_URL}/payroll/${id}/approve`, method: "PATCH" }),
      invalidatesTags: [{ type: tagTypes.payroll, id: "LIST" }],
    }),
    markPayrollPaid: build.mutation({
      query: (id: string) => ({ url: `${HRM_URL}/payroll/${id}/pay`, method: "PATCH" }),
      invalidatesTags: [{ type: tagTypes.payroll, id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useTerminateEmployeeMutation,
  useGetAttendanceQuery,
  useCreateAttendanceMutation,
  useGetAttendanceSummaryQuery,
  useGetAllLeavesQuery,
  useCreateLeaveMutation,
  useUpdateLeaveStatusMutation,
  useGetAllPayrollsQuery,
  useGeneratePayrollMutation,
  useApprovePayrollMutation,
  useMarkPayrollPaidMutation,
} = hrmApi;
