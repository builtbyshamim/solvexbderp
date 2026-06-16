import { useState } from 'react';
import { Download, TrendingUp, ShoppingCart, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useGetSalesSummaryQuery, useGetTopProductsQuery, useGetSalesByDateQuery } from './reportsApi';

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split('T')[0];

const SalesReport = () => {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);

  const params = { dateFrom, dateTo };

  const { data: summaryData, isFetching: loadingSummary } = useGetSalesSummaryQuery(params);
  const { data: topProductsData, isFetching: loadingProducts } = useGetTopProductsQuery({ ...params, limit: 10 });
  const { data: dailyData, isFetching: loadingDaily } = useGetSalesByDateQuery(params);

  const summary = summaryData ?? {};
  const topProducts: any[] = Array.isArray(topProductsData) ? topProductsData : [];
  const dailySales: any[] = Array.isArray(dailyData) ? dailyData : [];

  const isLoading = loadingSummary || loadingProducts || loadingDaily;

  const cards = [
    {
      label: 'Total Revenue',
      value: `৳${Number(summary.totalRevenue ?? 0).toLocaleString()}`,
      icon: <TrendingUp className="h-5 w-5 text-[#ff6d29]" />,
      bg: 'bg-orange-50 border-orange-200',
    },
    {
      label: 'Total Orders',
      value: Number(summary.totalSales ?? 0),
      icon: <ShoppingCart className="h-5 w-5 text-blue-500" />,
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Total Collected',
      value: `৳${Number(summary.totalCollected ?? 0).toLocaleString()}`,
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      bg: 'bg-green-50 border-green-200',
    },
    {
      label: 'Total Due',
      value: `৳${Number(summary.totalDue ?? 0).toLocaleString()}`,
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      bg: 'bg-red-50 border-red-200',
    },
    {
      label: 'Gross Profit',
      value: `৳${Number(summary.totalProfit ?? 0).toLocaleString()}`,
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      bg: 'bg-green-50 border-green-200',
    },
    {
      label: 'Profit Margin',
      value: summary.totalRevenue > 0
        ? `${((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1)}%`
        : '0%',
      icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
      bg: 'bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sales Report"
        subtitle="Sales performance overview"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'Reports' },
          { label: 'Sales Report' },
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className={`border rounded-lg p-4 ${c.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{c.label}</span>
              {c.icon}
            </div>
            <p className="text-xl font-bold text-[#26272F]">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Top Products */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm mb-5">
        <div className="px-4 py-3 border-b border-[#DBDFE9] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#26272F]">Top Selling Products</h3>
          {loadingProducts && <Loader2 className="h-4 w-4 animate-spin text-[#ff6d29]" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Product', 'SKU', 'Qty Sold', 'Revenue', 'Profit'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No product data for this period</td></tr>
              ) : topProducts.map((p, i) => (
                <tr key={p.productId ?? i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{p.productName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.sku || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{Number(p.totalQty).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold">৳{Number(p.totalRevenue).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{Number(p.totalProfit).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Sales Breakdown */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-[#DBDFE9] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#26272F]">Daily Sales Breakdown</h3>
          {loadingDaily && <Loader2 className="h-4 w-4 animate-spin text-[#ff6d29]" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Date', 'Orders', 'Revenue', 'Profit', 'Collected', 'Due'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dailySales.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No daily data for this period</td></tr>
              ) : dailySales.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">{row.salesCount}</td>
                  <td className="px-4 py-3 font-semibold">৳{Number(row.revenue).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{Number(row.profit).toLocaleString()}</td>
                  <td className="px-4 py-3 text-blue-600">৳{Number(row.collected).toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500">৳{Number(row.due).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
