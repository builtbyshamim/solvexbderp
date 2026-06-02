import { useState } from 'react';
import { Download, Users, Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useGetTopCustomersQuery } from './reportsApi';

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split('T')[0];

const CustomerReport = () => {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [limit, setLimit] = useState(20);

  const { data, isFetching } = useGetTopCustomersQuery({ dateFrom, dateTo, limit });
  const customers: any[] = Array.isArray(data) ? data : [];

  const totalSpent = customers.reduce((s, c) => s + Number(c.totalSpent ?? 0), 0);
  const totalDue = customers.reduce((s, c) => s + Number(c.totalDue ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Customer Report"
        subtitle="Top customers by purchase value"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'Reports' },
          { label: 'Customer Report' },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg p-4 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <label className="text-sm font-medium text-gray-600">Date Range:</label>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
        <span className="text-gray-400">—</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
        {isFetching && <Loader2 className="h-5 w-5 animate-spin text-[#ff6d29] ml-2" />}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Customers Found</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">{customers.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-700 mt-1">৳{totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-500">Total Outstanding Due</p>
          <p className="text-2xl font-bold text-red-600 mt-1">৳{totalDue.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#26272F]">Top Customers</h3>
          <div className="flex items-center gap-2">
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
              className="px-2 py-1 border border-[#DBDFE9] rounded text-xs focus:outline-none">
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-[#ff6d29]" />}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Customer', 'Phone', 'Orders', 'Total Spent', 'Paid', 'Due', 'Last Purchase'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" />
                </td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  No customer data for this period
                </td></tr>
              ) : customers.map((c, i) => (
                <tr key={c.customerId ?? i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.totalOrders}</td>
                  <td className="px-4 py-3 font-semibold">৳{Number(c.totalSpent).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{Number(c.totalPaid).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={Number(c.totalDue) > 0 ? 'text-red-500 font-medium' : 'text-gray-400'}>
                      {Number(c.totalDue) > 0 ? `৳${Number(c.totalDue).toLocaleString()}` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString() : '—'}
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

export default CustomerReport;
