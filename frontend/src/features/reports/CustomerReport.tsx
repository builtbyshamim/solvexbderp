import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';

const reportData = [
  { id: 1, name: 'Abdullah Al Mamun', phone: '01711-111111', total_purchase: 45000, paid: 45000, due: 0, last_purchase: '2025-05-24' },
  { id: 2, name: 'Fatema Begum', phone: '01722-222222', total_purchase: 18500, paid: 15000, due: 3500, last_purchase: '2025-05-21' },
  { id: 3, name: 'Karim Enterprise', phone: '01733-333333', total_purchase: 72000, paid: 50000, due: 22000, last_purchase: '2025-05-20' },
  { id: 4, name: 'Walk-in Customer', phone: '—', total_purchase: 21000, paid: 0, due: 21000, last_purchase: '2025-05-22' },
];

const CustomerReport = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const filtered = reportData.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search),
  );
  const totals = filtered.reduce(
    (s, r) => ({ total_purchase: s.total_purchase + r.total_purchase, paid: s.paid + r.paid, due: s.due + r.due }),
    { total_purchase: 0, paid: 0, due: 0 },
  );

  return (
    <div>
      <PageHeader
        title={t('reports.customerReport.title')}
        subtitle={t('reports.customerReport.subtitle')}
        breadcrumbs={[{ label: t('common.home'), path: '/admin' }, { label: t('nav.reports') }, { label: t('reports.customerReport.title') }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> {t('common.export')}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { labelKey: 'reports.customerReport.totalSales' as const, value: totals.total_purchase, cls: 'text-[#26272F]' },
          { labelKey: 'reports.customerReport.totalReceived' as const, value: totals.paid, cls: 'text-green-600' },
          { labelKey: 'reports.customerReport.totalDue' as const, value: totals.due, cls: 'text-red-500' },
        ].map((s) => (
          <div key={s.labelKey} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
            <p className="text-xs text-gray-500">{t(s.labelKey)}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>৳{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('reports.customerReport.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {[
                  t('common.customer'),
                  t('common.name'),
                  t('reports.customerReport.colTotalPurchase'),
                  t('common.paid'),
                  t('common.due'),
                  t('reports.customerReport.colLastPurchase'),
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#26272F]">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.phone}</td>
                  <td className="px-4 py-3 font-semibold">৳{row.total_purchase.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{row.paid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500">৳{row.due.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{row.last_purchase}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-[#DBDFE9] font-bold">
                <td colSpan={2} className="px-4 py-3">{t('common.total')}</td>
                <td className="px-4 py-3">৳{totals.total_purchase.toLocaleString()}</td>
                <td className="px-4 py-3 text-green-600">৳{totals.paid.toLocaleString()}</td>
                <td className="px-4 py-3 text-red-500">৳{totals.due.toLocaleString()}</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerReport;
