import { useState } from 'react';
import { Download, Package, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useGetPurchaseSummaryQuery, useGetTopSuppliersQuery } from './reportsApi';

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split('T')[0];

const PurchaseReport = () => {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);

  const params = { dateFrom, dateTo };

  const { data: summaryData, isFetching: loadingSummary } = useGetPurchaseSummaryQuery(params);
  const { data: suppliersData, isFetching: loadingSuppliers } = useGetTopSuppliersQuery({ ...params, limit: 20 });

  const summary = summaryData ?? {};
  const topSuppliers: any[] = Array.isArray(suppliersData) ? suppliersData : [];

  const isLoading = loadingSummary || loadingSuppliers;

  const cards = [
    {
      label: 'Total Purchase Amount',
      value: `৳${Number(summary.totalAmount ?? 0).toLocaleString()}`,
      icon: <Package className="h-5 w-5 text-blue-500" />,
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Total Orders',
      value: Number(summary.totalPurchases ?? 0),
      icon: <Package className="h-5 w-5 text-gray-500" />,
      bg: 'bg-gray-50 border-gray-200',
    },
    {
      label: 'Total Paid',
      value: `৳${Number(summary.totalPaid ?? 0).toLocaleString()}`,
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      bg: 'bg-green-50 border-green-200',
    },
    {
      label: 'Total Due',
      value: `৳${Number(summary.totalDue ?? 0).toLocaleString()}`,
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      bg: 'bg-red-50 border-red-200',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Report"
        subtitle="Purchase performance overview"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'Reports' },
          { label: 'Purchase Report' },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      {/* Date filter */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg p-4 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <label className="text-sm font-medium text-gray-600">Date Range:</label>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
        <span className="text-gray-400">—</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#ff6d29] ml-2" />}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className={`border rounded-lg p-4 ${c.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{c.label}</span>
              {c.icon}
            </div>
            <p className="text-2xl font-bold text-[#26272F]">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Top Suppliers */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-[#DBDFE9] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#26272F]">Top Suppliers by Purchase Volume</h3>
          {loadingSuppliers && <Loader2 className="h-4 w-4 animate-spin text-[#ff6d29]" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Supplier', 'Phone', 'Orders', 'Total Amount', 'Total Paid', 'Due', 'Last Purchase'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topSuppliers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No purchase data for this period</td></tr>
              ) : topSuppliers.map((s, i) => (
                <tr key={s.supplierId ?? i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.totalOrders}</td>
                  <td className="px-4 py-3 font-semibold">৳{Number(s.totalAmount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{Number(s.totalPaid).toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500">
                    {Number(s.totalDue) > 0 ? `৳${Number(s.totalDue).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {s.lastPurchase ? new Date(s.lastPurchase).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReport;
