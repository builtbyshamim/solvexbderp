import { useState } from 'react';
import { Download, Truck, Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useGetPayablesQuery, useGetTopSuppliersQuery } from './reportsApi';

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split('T')[0];

const SupplierReport = () => {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);

  const { data: payablesData, isFetching: loadingPayables } = useGetPayablesQuery();
  const { data: topData, isFetching: loadingTop } = useGetTopSuppliersQuery({ dateFrom, dateTo, limit: 50 });

  const payables: any[] = Array.isArray(payablesData) ? payablesData : [];
  const topSuppliers: any[] = Array.isArray(topData) ? topData : [];

  const totalPayable = payables.reduce((s, sup) => s + Number(sup.currentBalance ?? 0), 0);
  const totalPurchaseInPeriod = topSuppliers.reduce((s, sup) => s + Number(sup.totalAmount ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Supplier Report"
        subtitle="Outstanding payables and purchase activity"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'Reports' },
          { label: 'Supplier Report' },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Suppliers</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">{payables.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600">Purchase (Selected Period)</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">৳{totalPurchaseInPeriod.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-500">Total Payable (All Time)</p>
          <p className="text-2xl font-bold text-red-600 mt-1">৳{totalPayable.toLocaleString()}</p>
        </div>
      </div>

      {/* Period filter for activity */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg p-4 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <label className="text-sm font-medium text-gray-600">Period for Activity:</label>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
        <span className="text-gray-400">—</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
        {loadingTop && <Loader2 className="h-5 w-5 animate-spin text-[#ff6d29] ml-2" />}
      </div>

      {/* Top Suppliers Activity */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm mb-5">
        <div className="px-4 py-3 border-b border-[#DBDFE9]">
          <h3 className="text-sm font-semibold text-[#26272F]">Purchase Activity — Selected Period</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Supplier', 'Phone', 'Orders', 'Total Amount', 'Paid', 'Due', 'Last Purchase'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topSuppliers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No purchases in this period</td></tr>
              ) : topSuppliers.map((s, i) => (
                <tr key={s.supplierId ?? i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.totalOrders}</td>
                  <td className="px-4 py-3 font-semibold">৳{Number(s.totalAmount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{Number(s.totalPaid).toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500">{Number(s.totalDue) > 0 ? `৳${Number(s.totalDue).toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {s.lastPurchase ? new Date(s.lastPurchase).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Supplier Balances */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-[#DBDFE9] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#26272F]">Current Payable Balances (All Suppliers)</h3>
          {loadingPayables && <Loader2 className="h-4 w-4 animate-spin text-[#ff6d29]" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Supplier', 'Phone', 'Company', 'Opening Balance', 'Current Payable'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payables.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                  <Truck className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  No suppliers found
                </td></tr>
              ) : payables.filter((s) => Number(s.currentBalance) > 0).map((s, i) => (
                <tr key={s.id ?? i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{s.company ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">৳{Number(s.openingBalance).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${Number(s.currentBalance) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      ৳{Number(s.currentBalance).toLocaleString()}
                    </span>
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

export default SupplierReport;
