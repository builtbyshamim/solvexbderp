import { useState } from 'react';
import { Plus, Star, Target } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { useGetAllKPIQuery, useCreateKPIMutation, useGetAllEmployeesQuery } from './hrmApi';
import CommonPagination from '../../components/ui/paginations/CommonPagination';

const statusColors: Record<string, string> = {
  excellent: 'bg-green-100 text-green-700',
  good: 'bg-blue-100 text-blue-700',
  average: 'bg-yellow-100 text-yellow-700',
  poor: 'bg-red-100 text-red-500',
};

const now = new Date();
const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

const FORM_DEFAULT = { employeeId: '', period: defaultPeriod, year: now.getFullYear(), rating: 3, comment: '', salesTarget: '', salesActual: '', qualityRating: 3 };

const KPI = () => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState({ page: 1, limit: 10 });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...FORM_DEFAULT, period: defaultPeriod });

  const { data, isFetching, error } = useGetAllKPIQuery(searchValue);
  const { data: empData } = useGetAllEmployeesQuery({ limit: 500 });
  const [createKPI, { isLoading: isSaving }] = useCreateKPIMutation();

  const kpis = data?.data || [];
  const meta = data?.meta || { totalItems: 0, totalPages: 1 };
  const employees = empData?.data || [];

  const getStatus = (score: number) => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  };

  const handleSave = async () => {
    if (!form.employeeId || !form.period) { toast.error('Employee and period are required'); return; }
    try {
      await createKPI({ employeeId: form.employeeId, period: form.period, year: Number(form.year), rating: Number(form.rating), comment: form.comment || undefined }).unwrap();
      toast.success('KPI recorded');
      setShowModal(false);
      setForm({ ...FORM_DEFAULT });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to record KPI');
    }
  };

  const StarRating = ({ value }: { value: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="KPI Evaluation"
        subtitle="Track employee performance metrics"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'HRM', path: '/admin/hrm/employees' },
          { label: 'KPI' },
        ]}
        actions={
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> Add KPI
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#26272F]">KPI Records</h3>
          <span className="text-sm text-gray-500">{meta.totalItems} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Employee', 'Period', 'Sales Target', 'Sales Actual', 'Achievement', 'Quality Rating', 'Overall', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : (error || kpis.length === 0) ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <Target className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-gray-400">No KPI records yet</p>
                </td></tr>
              ) : kpis.map((item: any) => {
                const achievement = item.salesTarget > 0
                  ? Math.round((item.salesActual / item.salesTarget) * 100)
                  : 0;
                const overall = Math.round((achievement + (item.qualityRating ?? 5) * 10) / 2);
                const status = getStatus(overall);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.employee?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{item.period}</td>
                    <td className="px-4 py-3 text-gray-600">৳{Number(item.salesTarget ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#26272F] font-medium">৳{Number(item.salesActual ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-[#ff6d29] h-1.5 rounded-full" style={{ width: `${Math.min(achievement, 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{achievement}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StarRating value={item.qualityRating ?? 0} /></td>
                    <td className="px-4 py-3 font-bold text-[#26272F]">{overall}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[status]}`}>
                        {status}
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
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">Add KPI Evaluation</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Period (YYYY-MM)</label>
                <input type="month" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales Target</label>
                  <input type="number" value={form.salesTarget} onChange={(e) => setForm({ ...form, salesTarget: e.target.value })}
                    placeholder="0" min="0"
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales Actual</label>
                  <input type="number" value={form.salesActual} onChange={(e) => setForm({ ...form, salesActual: e.target.value })}
                    placeholder="0" min="0"
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rating (1-5)</label>
                <input type="range" min="1" max="5" value={form.qualityRating}
                  onChange={(e) => setForm({ ...form, qualityRating: Number(e.target.value) })}
                  className="w-full accent-[#ff6d29]" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Poor</span><span>Average</span><span>Excellent</span>
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

export default KPI;
