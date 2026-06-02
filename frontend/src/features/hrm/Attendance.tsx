import { useState } from 'react';
import { Search, Download, Clock, CheckCircle, XCircle, Plus, Users } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { useGetAttendanceQuery, useCreateAttendanceMutation, useGetAllEmployeesQuery } from './hrmApi';
import CommonPagination from '../../components/ui/paginations/CommonPagination';

const statusColors: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  late: 'bg-yellow-100 text-yellow-700',
  absent: 'bg-red-100 text-red-500',
  half_day: 'bg-blue-100 text-blue-700',
  on_leave: 'bg-purple-100 text-purple-700',
};

const today = new Date().toISOString().split('T')[0];

const Attendance = () => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState({ page: 1, limit: 20 });
  const [filters, setFilters] = useState({ date: today, status: '' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: '', date: today, checkIn: '', checkOut: '', status: 'present', note: '' });

  const { data, isFetching } = useGetAttendanceQuery({ ...searchValue, ...filters });
  const { data: empData } = useGetAllEmployeesQuery({ limit: 500 });
  const [createAttendance, { isLoading: isSaving }] = useCreateAttendanceMutation();

  const records = data?.data || [];
  const meta = data?.meta || { totalItems: 0, totalPages: 1 };
  const employees = empData?.data || [];

  const stats = {
    present: records.filter((r: any) => r.status === 'present').length,
    late: records.filter((r: any) => r.status === 'late').length,
    absent: records.filter((r: any) => r.status === 'absent').length,
    total: records.length,
  };

  const handleSave = async () => {
    if (!form.employeeId || !form.date) { toast.error('Employee and date are required'); return; }
    try {
      await createAttendance(form).unwrap();
      toast.success('Attendance recorded');
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to record attendance');
    }
  };

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Track daily employee attendance"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'HRM', path: '/admin/hrm/employees' },
          { label: 'Attendance' },
        ]}
        actions={
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> Record Attendance
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, cls: 'text-[#26272F]', bg: 'bg-white border border-[#DBDFE9]', icon: <Users className="h-5 w-5 text-gray-400" /> },
          { label: 'Present', value: stats.present, cls: 'text-green-700', bg: 'bg-green-50 border border-green-200', icon: <CheckCircle className="h-5 w-5 text-green-600" /> },
          { label: 'Late', value: stats.late, cls: 'text-yellow-700', bg: 'bg-yellow-50 border border-yellow-200', icon: <Clock className="h-5 w-5 text-yellow-600" /> },
          { label: 'Absent', value: stats.absent, cls: 'text-red-600', bg: 'bg-red-50 border border-red-200', icon: <XCircle className="h-5 w-5 text-red-500" /> },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-lg p-4 flex items-center gap-3`}>
            <div className="flex-shrink-0">{s.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3">
          <input type="date" value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="half_day">Half Day</option>
            <option value="on_leave">On Leave</option>
          </select>
          <span className="text-sm text-gray-500 self-center">{meta.totalItems} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Employee', 'Code', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No attendance records for this date</td></tr>
              ) : records.map((rec: any) => {
                const hours = rec.checkIn && rec.checkOut
                  ? ((new Date(`1970-01-01T${rec.checkOut}`) - new Date(`1970-01-01T${rec.checkIn}`)) / 3600000).toFixed(1)
                  : '—';
                return (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#26272F]">{rec.employee?.name ?? rec.employeeId}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{rec.employee?.employeeCode ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(rec.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-600">{rec.checkIn || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{rec.checkOut || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{hours}h</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[rec.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {rec.status?.replace('_', ' ')}
                      </span>
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
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">Record Attendance</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee <span className="text-red-500">*</span></label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="">Select employee...</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="half_day">Half Day</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                  <input type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                  <input type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={isSaving}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
