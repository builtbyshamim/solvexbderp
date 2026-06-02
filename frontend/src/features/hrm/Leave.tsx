import { useState } from 'react';
import { Search, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { useGetAllLeavesQuery, useCreateLeaveMutation, useUpdateLeaveStatusMutation, useGetAllEmployeesQuery } from './hrmApi';
import CommonPagination from '../../components/ui/paginations/CommonPagination';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-500',
};

const FORM_DEFAULT = { employeeId: '', leaveType: 'annual', startDate: '', endDate: '', reason: '' };

const Leave = () => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState({ page: 1, limit: 10 });
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_DEFAULT);

  const { data, isFetching } = useGetAllLeavesQuery({ ...searchValue, ...(statusFilter && { status: statusFilter }) });
  const { data: empData } = useGetAllEmployeesQuery({ limit: 500 });
  const [createLeave, { isLoading: isSaving }] = useCreateLeaveMutation();
  const [updateLeaveStatus, { isLoading: isUpdating }] = useUpdateLeaveStatusMutation();

  const leaves = data?.data || [];
  const meta = data?.meta || { totalItems: 0, totalPages: 1 };
  const employees = empData?.data || [];

  const stats = {
    pending: leaves.filter((l: any) => l.status === 'pending').length,
    approved: leaves.filter((l: any) => l.status === 'approved').length,
    rejected: leaves.filter((l: any) => l.status === 'rejected').length,
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateLeaveStatus({ id, data: { status } }).unwrap();
      toast.success(`Leave ${status}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update');
    }
  };

  const handleSave = async () => {
    if (!form.employeeId || !form.startDate || !form.endDate) {
      toast.error('Employee, from date and to date are required'); return;
    }
    try {
      await createLeave(form).unwrap();
      toast.success('Leave request submitted');
      setShowModal(false);
      setForm(FORM_DEFAULT);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit leave');
    }
  };

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle="Manage employee leave requests"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'HRM', path: '/admin/hrm/employees' },
          { label: 'Leave' },
        ]}
        actions={
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> New Leave Request
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', value: stats.pending, cls: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
          { label: 'Approved', value: stats.approved, cls: 'text-green-700', bg: 'bg-green-50 border-green-200' },
          { label: 'Rejected', value: stats.rejected, cls: 'text-red-600', bg: 'bg-red-50 border-red-200' },
        ].map((s) => (
          <div key={s.label} className={`border rounded-lg p-4 text-center ${s.bg}`}>
            <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <span className="text-sm text-gray-500">{meta.totalItems} requests</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Employee', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No leave requests</td></tr>
              ) : leaves.map((item: any) => {
                const days = item.startDate && item.endDate
                  ? Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / 86400000) + 1
                  : item.days ?? '—';
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.employee?.name ?? '—'}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{(item.leaveType ?? item.type ?? '—').replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-600">{item.startDate ? new Date(item.startDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.endDate ? new Date(item.endDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 font-semibold text-[#26272F]">{days}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate">{item.reason || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {item.status === 'pending' && <Clock className="h-3 w-3" />}
                        {item.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                        {item.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleStatusUpdate(item.id, 'approved')} disabled={isUpdating}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50">
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </button>
                          <button onClick={() => handleStatusUpdate(item.id, 'rejected')} disabled={isUpdating}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50">
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <CommonPagination total={meta.totalItems} totalPage={meta.totalPages}
            setSearchValue={setSearchValue} searchValue={searchValue}
            limit={searchValue.limit} page={searchValue.page} />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">New Leave Request</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee <span className="text-red-500">*</span></label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="">Select employee...</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="casual">Casual</option>
                  <option value="maternity">Maternity</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From <span className="text-red-500">*</span></label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To <span className="text-red-500">*</span></label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={2} placeholder="Reason for leave..."
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={isSaving}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
