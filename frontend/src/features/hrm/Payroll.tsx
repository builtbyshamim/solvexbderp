import { useState } from 'react';
import { CheckCircle, DollarSign, Plus } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import {
  useGetAllPayrollsQuery, useGeneratePayrollMutation,
  useApprovePayrollMutation, useMarkPayrollPaidMutation,
  useGetAllEmployeesQuery,
} from './hrmApi';
import CommonPagination from '../../components/ui/paginations/CommonPagination';

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
};

const now = new Date();

const Payroll = () => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), status: '' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: '', month: now.getMonth() + 1, year: now.getFullYear() });

  const { data, isFetching } = useGetAllPayrollsQuery({
    ...searchValue,
    month: filters.month,
    year: filters.year,
    ...(filters.status && { status: filters.status }),
  });
  const { data: empData } = useGetAllEmployeesQuery({ limit: 500 });
  const [generatePayroll, { isLoading: isGenerating }] = useGeneratePayrollMutation();
  const [approvePayroll, { isLoading: isApproving }] = useApprovePayrollMutation();
  const [markPaid, { isLoading: isMarking }] = useMarkPayrollPaidMutation();

  const payrolls = data?.data || [];
  const meta = data?.meta || { totalItems: 0, totalPages: 1 };
  const employees = empData?.data || [];

  const totalPayroll = payrolls.reduce((s: number, p: any) => s + Number(p.netSalary ?? 0), 0);
  const totalPaid = payrolls.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.netSalary ?? 0), 0);
  const totalPending = totalPayroll - totalPaid;

  const handleGenerate = async () => {
    if (!form.employeeId) { toast.error('Select an employee'); return; }
    try {
      await generatePayroll(form).unwrap();
      toast.success('Payroll generated');
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to generate payroll');
    }
  };

  const handleApprove = async (id: string) => {
    try { await approvePayroll(id).unwrap(); toast.success('Payroll approved'); }
    catch (err: any) { toast.error(err?.data?.message || 'Failed'); }
  };

  const handlePay = async (id: string) => {
    try { await markPaid(id).unwrap(); toast.success('Payroll marked as paid'); }
    catch (err: any) { toast.error(err?.data?.message || 'Failed'); }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="Generate and manage employee payroll"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'HRM', path: '/admin/hrm/employees' },
          { label: 'Payroll' },
        ]}
        actions={
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> Generate Payroll
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Payroll</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">৳{totalPayroll.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-600">Total Paid</p>
          <p className="text-2xl font-bold text-green-700 mt-1">৳{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">৳{totalPending.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3">
          <select value={filters.month} onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
          <span className="text-sm text-gray-500 self-center">{meta.totalItems} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Employee', 'Month/Year', 'Basic', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : payrolls.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No payroll records for this period</td></tr>
              ) : payrolls.map((item: any) => {
                const allowances = Number(item.houseRent ?? 0) + Number(item.medicalAllowance ?? 0) + Number(item.transportAllowance ?? 0) + Number(item.otherAllowances ?? 0);
                const deductions = Number(item.totalDeduction ?? 0);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.employee?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{months[(item.month ?? 1) - 1]} {item.year}</td>
                    <td className="px-4 py-3">৳{Number(item.basicSalary ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-blue-600">৳{allowances.toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-500">৳{deductions.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-[#26272F]">৳{Number(item.netSalary ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {item.status === 'draft' && (
                          <button onClick={() => handleApprove(item.id)} disabled={isApproving}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50">
                            <CheckCircle className="h-3 w-3" /> Approve
                          </button>
                        )}
                        {item.status === 'approved' && (
                          <button onClick={() => handlePay(item.id)} disabled={isMarking}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50">
                            <DollarSign className="h-3 w-3" /> Pay
                          </button>
                        )}
                      </div>
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
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">Generate Payroll</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee <span className="text-red-500">*</span></label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="">Select employee...</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                    {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                    {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleGenerate} disabled={isGenerating}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {isGenerating && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
