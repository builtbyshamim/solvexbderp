import { useState } from 'react';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useGetProfitLossQuery } from './reportsApi';

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const ProfitLossReport = () => {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);

  const { data, isFetching } = useGetProfitLossQuery({ dateFrom, dateTo });
  const report = data ?? {};

  const revenue = Number(report.revenue ?? 0);
  const cogs = Number(report.costOfGoods ?? 0);
  const grossProfit = Number(report.grossProfit ?? (revenue - cogs));
  const netProfit = Number(report.netProfit ?? grossProfit);
  const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0';

  return (
    <div>
      <PageHeader
        title={t('reports.profitLossReport.title')}
        subtitle="Profit & Loss statement"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'Reports' },
          { label: t('reports.profitLossReport.title') },
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
        {isFetching && <div className="w-5 h-5 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin ml-2" />}
      </div>

      {/* P&L Statement */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-[#DBDFE9]">
          <h3 className="text-sm font-semibold text-[#26272F]">Profit & Loss Statement</h3>
          <p className="text-xs text-gray-400">{dateFrom} to {dateTo}</p>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Revenue (Sales)', value: revenue, cls: 'text-[#26272F]', border: true },
            { label: 'Cost of Goods Sold (COGS)', value: -cogs, cls: 'text-red-500', border: false },
            { label: 'Gross Profit', value: grossProfit, cls: grossProfit >= 0 ? 'text-green-700' : 'text-red-600', border: true, bold: true },
            { label: 'Net Profit', value: netProfit, cls: netProfit >= 0 ? 'text-green-700' : 'text-red-600', border: true, bold: true, large: true },
          ].map((row) => (
            <div key={row.label} className={`flex items-center justify-between py-2 ${row.border ? 'border-t border-[#DBDFE9]' : ''} ${row.large ? 'mt-2' : ''}`}>
              <span className={`text-sm ${row.bold ? 'font-semibold text-[#26272F]' : 'text-gray-600'}`}>{row.label}</span>
              <span className={`${row.large ? 'text-xl' : 'text-sm'} font-${row.bold ? 'bold' : 'medium'} ${row.cls}`}>
                {row.value >= 0 ? '' : '−'}৳{Math.abs(row.value).toLocaleString()}
              </span>
            </div>
          ))}

          {/* Profit margin */}
          <div className="mt-4 pt-4 border-t border-[#DBDFE9] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Net Profit Margin</span>
              <div className="flex items-center gap-2">
                {netProfit >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{report.profitMargin ?? margin}%</span>
              </div>
            </div>
            {Number(report.totalPurchases ?? 0) > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Total Purchases (same period)</span>
                <span className="font-medium">৳{Number(report.totalPurchases).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category breakdown if available */}
      {report.categories?.length > 0 && (
        <div className="mt-5 bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-[#DBDFE9]">
            <h3 className="text-sm font-semibold text-[#26272F]">Category Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                  {['Category', 'Revenue', 'COGS', 'Gross Profit', 'Margin'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.categories.map((cat: any, i: number) => {
                  const gp = Number(cat.revenue ?? 0) - Number(cat.cogs ?? 0);
                  const m = Number(cat.revenue ?? 0) > 0 ? ((gp / Number(cat.revenue)) * 100).toFixed(1) : '0';
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#26272F]">{cat.name}</td>
                      <td className="px-4 py-3 font-semibold">৳{Number(cat.revenue ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-500">৳{Number(cat.cogs ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-700 font-medium">৳{gp.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{m}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLossReport;
