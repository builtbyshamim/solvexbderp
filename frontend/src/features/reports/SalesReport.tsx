import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';

const reportData = [
  { date: '2025-05-20', invoice: 'INV-001', customer: 'Abdullah Al Mamun', items: 3, subtotal: 12000, discount: 500, total: 11500, paid: 11500, due: 0, profit: 3200 },
  { date: '2025-05-21', invoice: 'INV-002', customer: 'Fatema Begum', items: 2, subtotal: 8500, discount: 0, total: 8500, paid: 5000, due: 3500, profit: 2100 },
  { date: '2025-05-22', invoice: 'INV-003', customer: 'Walk-in', items: 5, subtotal: 22000, discount: 1000, total: 21000, paid: 0, due: 21000, profit: 6500 },
  { date: '2025-05-24', invoice: 'INV-004', customer: 'Karim Enterprise', items: 1, subtotal: 5500, discount: 0, total: 5500, paid: 5500, due: 0, profit: 1800 },
];

const SalesReport = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('2025-05-01');
  const [to, setTo] = useState('2025-05-31');

  const filtered = reportData.filter((r) =>
    r.customer.toLowerCase().includes(search.toLowerCase()) || r.invoice.toLowerCase().includes(search.toLowerCase()),
  );

  const totals = filtered.reduce((s, r) => ({ total: s.total + r.total, paid: s.paid + r.paid, due: s.due + r.due, profit: s.profit + r.profit }), { total: 0, paid: 0, due: 0, profit: 0 });

  return (
    <div>
      <PageHeader
        title={t('reports.salesReport.title')}
        subtitle={t('reports.salesReport.subtitle')}
        breadcrumbs={[{ label: t('common.home'), path: '/admin' }, { label: t('nav.reports') }, { label: t('reports.salesReport.title') }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> {t('common.export')}
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('common.fromDate')}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('common.toDate')}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
        </div>
        <div className="relative flex-1 sm:max-w-xs self-end">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { labelKey: 'reports.salesReport.totalSales' as const, value: totals.total, cls: 'text-[#26272F]' },
          { labelKey: 'reports.salesReport.totalPaid' as const, value: totals.paid, cls: 'text-green-600' },
          { labelKey: 'reports.salesReport.totalDue' as const, value: totals.due, cls: 'text-red-500' },
          { labelKey: 'reports.salesReport.totalProfit' as const, value: totals.profit, cls: 'text-blue-600' },
        ].map((s) => (
          <div key={s.labelKey} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
            <p className="text-xs text-gray-500">{t(s.labelKey)}</p>
            <p className={`text-xl font-bold mt-1 ${s.cls}`}>৳{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {[
                  t('common.date'),
                  t('reports.salesReport.colInvoice'),
                  t('reports.salesReport.colCustomer'),
                  t('common.total'),
                  t('common.paid'),
                  t('common.due'),
                  t('reports.salesReport.colProfit'),
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{row.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#ff6d29]">{row.invoice}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{row.customer}</td>
                  <td className="px-4 py-3 font-semibold">৳{row.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{row.paid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500">৳{row.due.toLocaleString()}</td>
                  <td className="px-4 py-3 text-blue-600">৳{row.profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-[#DBDFE9] font-bold">
                <td colSpan={3} className="px-4 py-3">{t('common.total')}</td>
                <td className="px-4 py-3">৳{totals.total.toLocaleString()}</td>
                <td className="px-4 py-3 text-green-600">৳{totals.paid.toLocaleString()}</td>
                <td className="px-4 py-3 text-red-500">৳{totals.due.toLocaleString()}</td>
                <td className="px-4 py-3 text-blue-600">৳{totals.profit.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
