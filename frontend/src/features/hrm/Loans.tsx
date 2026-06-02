import { useState } from 'react';
import { Plus, Search, CreditCard } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { useGetAllLoansQuery, useCreateLoanMutation, useGetAllEmployeesQuery } from './hrmApi';
import CommonPagination from '../../components/ui/paginations/CommonPagination';

const statusColors: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-500',
};

const FORM_DEFAULT = { employeeId: '', loanType: 'loan', amount: '', monthlyInstallment: '', issueDate: new Date().toISOString().split('T')[0], note: '' };

const Loans = () => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState({ page: 1, limit: 10 });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_DEFAULT);

  const { data, isFetching, error } = useGetAllLoansQuery(searchValue);
  const { data: empData } = useGetAllEmployeesQuery({ limit: 500 });
  const [createLoan, { isLoading: isSaving }] = useCreateLoanMutation();

  const loans = data?.data || [];
  const meta = data?.meta || { totalItems: 0, totalPages: 1 };
  const employees = empData?.data || [];

  const totalLoans = loans.reduce((s: number, l: any) => s + Number(l.amount ?? 0), 0);
  const totalPaid = loans.reduce((s: number, l: any) => s + Math.max(0, Number(l.amount ?? 0) - Number(l.remainingAmount ?? 0)), 0);
  const totalOutstanding = totalLoans - totalPaid;

  const handleSave = async () => {
    if (!form.employeeId || !form.amount) { toast.error('Employee and amount are required'); return; }
    try {
      await createLoan({ ...form, amount: Number(form.amount), monthlyInstallment: Number(form.monthlyInstallment) || undefined }).unwrap();
      toast.success('Loan created');
      setShowModal(false);
      setForm(FORM_DEFAULT);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create loan');
    }
  };

  return (
    <div>
      <PageHeader
        title="Loans & Advances"
        subtitle="Manage employee loans and advance payments"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'HRM', path: '/admin/hrm/employees' },
          { label: 'Loans & Advances' },
        ]}
        actions={
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> New Loan
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Loans</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">৳{totalLoans.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-600">Total Paid</p>
          <p className="text-2xl font-bold text-green-700 mt-1">৳{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-500">Outstanding</p>
          <p className="text-2xl font-bold text-red-600 mt-1">৳{totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#26272F]">All Loans & Advances</h3>
          <span className="text-sm text-gray-500">{meta.totalItems} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Employee', 'Type', 'Amount', 'Paid', 'Remaining', 'Installment', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : (error || loans.length === 0) ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <CreditCard className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-gray-400">No loans or advances yet</p>
                </td></tr>
              ) : loans.map((item: any) => {
                const remaining = Number(item.amount ?? 0) - Number(item.paid ?? 0);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.employee?.name ?? '—'}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{item.type}</td>
                    <td className="px-4 py-3 font-semibold">৳{Number(item.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600">৳{Number(item.paid ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-500">৳{remaining.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">৳{Number(item.installment ?? 0).toLocaleString()}/mo</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {item.status}
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
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">New Loan / Advance</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                    <option value="loan">Loan</option>
                    <option value="advance">Advance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00" min="0"
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Installment</label>
                <input type="number" value={form.installment} onChange={(e) => setForm({ ...form, installment: e.target.value })}
                  placeholder="0.00" min="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={2} placeholder="Reason for loan..."
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
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

export default Loans;
