import { useState } from 'react';
import { Download, Loader2, CreditCard, TrendingDown, Wallet, Hash } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useGetAllCustomersQuery, useGetCollectionReportQuery } from './salesApi';

const fmtN = (n: number | string) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const methodBadge: Record<string, string> = {
  cash: 'bg-green-100 text-green-700',
  card: 'bg-blue-100 text-blue-700',
  bkash: 'bg-pink-100 text-pink-700',
  nagad: 'bg-orange-100 text-orange-700',
  rocket: 'bg-purple-100 text-purple-700',
  bank_transfer: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700',
};

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

const CollectionReport = () => {
  const [customerId, setCustomerId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(1);

  const { data: customersData } = useGetAllCustomersQuery({ limit: 500 });
  const customers: any[] = customersData?.data ?? [];

  const { data, isLoading, isFetching } = useGetCollectionReportQuery({
    customerId: customerId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    method: method || undefined,
    page,
    limit: 20,
  });

  const collections: any[] = data?.data ?? [];
  const meta = data?.meta;
  const totals = data?.totals ?? { totalCollected: 0, totalRebate: 0, netCollection: 0, count: 0 };

  const resetFilters = () => {
    setCustomerId('');
    setDateFrom('');
    setDateTo('');
    setMethod('');
    setPage(1);
  };

  const summaryCards = [
    {
      label: 'Total Collected',
      value: `৳${fmtN(totals.totalCollected)}`,
      cls: 'text-[#26272F]',
      icon: CreditCard,
      bg: 'bg-blue-50',
      iconCls: 'text-blue-500',
    },
    {
      label: 'Total Rebate',
      value: `৳${fmtN(totals.totalRebate)}`,
      cls: 'text-orange-600',
      icon: TrendingDown,
      bg: 'bg-orange-50',
      iconCls: 'text-orange-500',
    },
    {
      label: 'Net Collection',
      value: `৳${fmtN(totals.netCollection)}`,
      cls: 'text-green-700',
      icon: Wallet,
      bg: 'bg-green-50',
      iconCls: 'text-green-500',
    },
    {
      label: 'Transactions',
      value: String(totals.count ?? 0),
      cls: 'text-[#26272F]',
      icon: Hash,
      bg: 'bg-gray-50',
      iconCls: 'text-gray-400',
    },
  ] as const;

  return (
    <div>
      <PageHeader
        title="Collection Report"
        subtitle="All customer payment collections with rebate breakdown"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Sales', path: '/admin/sales/list' },
          { label: 'Collection Report' },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white border border-[#DBDFE9] rounded-lg p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
              <card.icon className={`h-5 w-5 ${card.iconCls}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{card.label}</p>
              <p className={`text-base font-bold ${card.cls} truncate`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Customer</label>
            <select
              value={customerId}
              onChange={(e) => { setCustomerId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
            >
              <option value="">All Customers</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">From Date</label>
            <input
              type="date" value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">To Date</label>
            <input
              type="date" value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
            <select
              value={method}
              onChange={(e) => { setMethod(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
            >
              <option value="">All Methods</option>
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        {(customerId || dateFrom || dateTo || method) && (
          <div className="mt-3 flex justify-end">
            <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-[#ff6d29] transition-colors">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Date', 'Customer', 'Invoice', 'Method', 'Collected', 'Rebate', 'Net Amount', 'Note'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" />
                  </td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <CreditCard className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 text-sm">No collections found</p>
                    <p className="text-gray-300 text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                collections.map((c: any, i: number) => {
                  const net = Number(c.amount) - Number(c.rebate ?? 0);
                  const mKey = (c.method ?? 'other').toLowerCase();
                  return (
                    <tr key={c.id ?? i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * 20 + i + 1}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(c.date ?? c.paidAt ?? c.createdAt).toLocaleDateString('en-BD', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#26272F] whitespace-nowrap">
                        {c.customer?.name ?? c.customerName ?? '—'}
                        {c.customer?.mobile && (
                          <p className="text-xs text-gray-400 font-normal">{c.customer.mobile}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#ff6d29]">
                        {c.invoiceNo ?? c.sale?.invoiceNo ?? <span className="text-gray-400 font-sans">Bulk</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${methodBadge[mKey] ?? 'bg-gray-100 text-gray-600'}`}>
                          {(c.method ?? 'other').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#26272F]">৳{fmtN(c.amount)}</td>
                      <td className="px-4 py-3 font-medium text-orange-500">
                        {Number(c.rebate) > 0 ? `৳${fmtN(c.rebate)}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 font-bold text-green-700">৳{fmtN(net)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate" title={c.note}>
                        {c.note || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table footer totals */}
            {collections.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-[#DBDFE9]">
                  <td colSpan={5} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Page Total</td>
                  <td className="px-4 py-3 font-bold text-[#26272F]">
                    ৳{fmtN(collections.reduce((s, c) => s + Number(c.amount ?? 0), 0))}
                  </td>
                  <td className="px-4 py-3 font-bold text-orange-500">
                    ৳{fmtN(collections.reduce((s, c) => s + Number(c.rebate ?? 0), 0))}
                  </td>
                  <td className="px-4 py-3 font-bold text-green-700">
                    ৳{fmtN(collections.reduce((s, c) => s + Number(c.amount ?? 0) - Number(c.rebate ?? 0), 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-[#DBDFE9]">
            <p className="text-xs text-gray-500">
              Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total.toLocaleString()} records
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={meta.page <= 1}
                className="px-2.5 py-1.5 text-xs border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >«</button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="px-3 py-1.5 text-xs border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >← Prev</button>
              <span className="px-3 py-1.5 text-xs bg-[#ff6d29] text-white rounded-lg font-medium">
                {meta.page} / {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="px-3 py-1.5 text-xs border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >Next →</button>
              <button
                onClick={() => setPage(meta.totalPages)}
                disabled={meta.page >= meta.totalPages}
                className="px-2.5 py-1.5 text-xs border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionReport;
