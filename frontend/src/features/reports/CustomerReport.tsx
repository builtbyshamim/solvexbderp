import { useState, useMemo } from 'react';
import {
  Users, TrendingUp, Download, Loader2, Star,
  AlertCircle, ShoppingCart, Clock, ArrowUpDown,
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useGetTopCustomersQuery, useGetSalesSummaryQuery } from './reportsApi';

// ── helpers ──────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split('T')[0];

const fmt = (n: number) => n.toLocaleString('en-BD');
const fmtCur = (n: number) => `৳${fmt(n)}`;
const pct = (part: number, total: number) =>
  total > 0 ? ((part / total) * 100).toFixed(1) : '0.0';

const daysSince = (dateStr: string) => {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

type SortKey = 'totalSpent' | 'totalOrders' | 'totalDue';

// ── Loyalty tier based on order count ────────────────────────────────────────
const TIERS = [
  { min: 10, label: 'VIP', bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '⭐' },
  { min: 5,  label: 'Loyal', bg: 'bg-purple-100 text-purple-700 border-purple-300', icon: '💜' },
  { min: 2,  label: 'Regular', bg: 'bg-blue-100 text-blue-700 border-blue-300', icon: '🔵' },
  { min: 0,  label: 'New', bg: 'bg-green-100 text-green-700 border-green-300', icon: '🌱' },
];

const getTier = (orders: number) => TIERS.find((t) => orders >= t.min)!;

const RANK_STYLE = [
  'bg-yellow-400 text-yellow-900',
  'bg-gray-300 text-gray-700',
  'bg-amber-600 text-amber-100',
];

// ── CSV export ────────────────────────────────────────────────────────────────

const exportCSV = (customers: any[], dateFrom: string, dateTo: string) => {
  const header = [
    'Rank', 'Name', 'Phone', 'Orders', 'Total Spent (৳)',
    'Total Paid (৳)', 'Due (৳)', 'Tier', 'Last Purchase',
  ];
  const rows = customers.map((c, i) => [
    i + 1, c.name, c.phone ?? '',
    c.totalOrders, c.totalSpent, c.totalPaid, c.totalDue,
    getTier(Number(c.totalOrders)).label,
    c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString() : '',
  ]);
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `top-customers-${dateFrom}-${dateTo}.csv`;
  a.click();
};

// ── Component ─────────────────────────────────────────────────────────────────

const CustomerReport = () => {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [sortBy, setSortBy] = useState<SortKey>('totalSpent');
  const [limit, setLimit] = useState(20);

  const params = { dateFrom, dateTo };

  const { data: rawCustomers, isFetching: loadingCust } =
    useGetTopCustomersQuery({ ...params, limit: 100 });
  const { data: summary, isFetching: loadingSummary } = useGetSalesSummaryQuery(params);

  const isFetching = loadingCust || loadingSummary;

  const customers: any[] = useMemo(() => {
    const list: any[] = Array.isArray(rawCustomers) ? rawCustomers : [];
    return [...list]
      .sort((a, b) => Number(b[sortBy]) - Number(a[sortBy]))
      .slice(0, limit);
  }, [rawCustomers, sortBy, limit]);

  const totalRevenue = Number(summary?.totalRevenue ?? 0);

  const totalSpent = customers.reduce((s, c) => s + Number(c.totalSpent ?? 0), 0);
  const totalDue = customers.reduce((s, c) => s + Number(c.totalDue ?? 0), 0);
  const totalOrders = customers.reduce((s, c) => s + Number(c.totalOrders ?? 0), 0);

  const maxSpent = customers[0] ? Number(customers[0].totalSpent) : 1;

  const tierCounts = customers.reduce((acc: Record<string, number>, c) => {
    const tier = getTier(Number(c.totalOrders)).label;
    acc[tier] = (acc[tier] ?? 0) + 1;
    return acc;
  }, {});

  const SORT_TABS: { key: SortKey; label: string }[] = [
    { key: 'totalSpent', label: 'By Spent' },
    { key: 'totalOrders', label: 'By Orders' },
    { key: 'totalDue', label: 'By Due' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customer Report"
        subtitle="Top customers by purchase value, order frequency, and loyalty"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'Reports' },
          { label: 'Customer Report' },
        ]}
        actions={
          <button
            onClick={() => exportCSV(customers, dateFrom, dateTo)}
            className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <label className="text-sm font-medium text-gray-600">Date Range:</label>
        <input
          type="date" value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
        />
        <span className="text-gray-400">—</span>
        <input
          type="date" value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
        />
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>Top {n}</option>
          ))}
        </select>
        {isFetching && <Loader2 className="h-5 w-5 animate-spin text-[#ff6d29]" />}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue', value: fmtCur(totalSpent),
            icon: <TrendingUp className="h-5 w-5 text-[#ff6d29]" />,
            bg: 'bg-orange-50 border-orange-200',
          },
          {
            label: 'Customers Found', value: customers.length,
            icon: <Users className="h-5 w-5 text-blue-500" />,
            bg: 'bg-blue-50 border-blue-200',
          },
          {
            label: 'Total Orders', value: fmt(totalOrders),
            icon: <ShoppingCart className="h-5 w-5 text-purple-500" />,
            bg: 'bg-purple-50 border-purple-200',
          },
          {
            label: 'Outstanding Due', value: fmtCur(totalDue),
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
            bg: 'bg-red-50 border-red-200',
          },
        ].map((c) => (
          <div key={c.label} className={`border rounded-xl p-4 ${c.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">{c.label}</span>
              {c.icon}
            </div>
            <p className="text-xl font-bold text-[#26272F]">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tier summary + table */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

        {/* Tier breakdown */}
        <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm p-4 xl:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-semibold text-[#26272F]">Loyalty Tiers</h3>
          </div>
          <div className="space-y-3">
            {TIERS.map((tier) => {
              const count = tierCounts[tier.label] ?? 0;
              const tierPct = customers.length > 0 ? (count / customers.length) * 100 : 0;
              return (
                <div key={tier.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5">
                      <span>{tier.icon}</span>
                      <span className="font-medium text-gray-700">{tier.label}</span>
                    </span>
                    <span className="text-gray-500">{count} customers</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#ff6d29] rounded-full transition-all"
                      style={{ width: `${tierPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
            <div>🌱 New = 1 order</div>
            <div>🔵 Regular = 2–4 orders</div>
            <div>💜 Loyal = 5–9 orders</div>
            <div>⭐ VIP = 10+ orders</div>
          </div>
        </div>

        {/* Customer table */}
        <div className="xl:col-span-3 bg-white border border-[#DBDFE9] rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DBDFE9] flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-semibold text-[#26272F]">Top Customers</span>
            </div>
            <div className="ml-auto flex gap-1">
              {SORT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSortBy(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sortBy === tab.key
                      ? 'bg-[#ff6d29] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                  {['#', 'Customer', 'Tier', 'Orders', 'Total Spent', 'Paid', 'Due', 'Last Visit'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingCust ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" />
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                      <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No customer data for this period
                    </td>
                  </tr>
                ) : customers.map((c, i) => {
                  const tier = getTier(Number(c.totalOrders));
                  const barPct = maxSpent > 0 ? (Number(c.totalSpent) / maxSpent) * 100 : 0;
                  const share = pct(Number(c.totalSpent), totalRevenue);
                  const days = daysSince(c.lastPurchase);
                  const hasDue = Number(c.totalDue) > 0;

                  return (
                    <tr key={c.customerId ?? i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {i < 3 ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${RANK_STYLE[i]}`}>
                            {i + 1}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm pl-1">{i + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="font-medium text-[#26272F] truncate">{c.name}</div>
                        {c.phone && (
                          <div className="text-xs text-gray-400">{c.phone}</div>
                        )}
                        <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden w-full">
                          <div
                            className="h-full bg-[#ff6d29] rounded-full transition-all duration-500"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <div className="text-xs text-blue-500 mt-0.5">{share}% of revenue</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tier.bg}`}>
                          {tier.icon} {tier.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">{c.totalOrders}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums">{fmtCur(Number(c.totalSpent))}</td>
                      <td className="px-4 py-3 text-green-600 tabular-nums">{fmtCur(Number(c.totalPaid))}</td>
                      <td className="px-4 py-3">
                        {hasDue ? (
                          <span className="text-red-500 font-medium tabular-nums">
                            {fmtCur(Number(c.totalDue))}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {days === null ? (
                          <span className="text-gray-400">—</span>
                        ) : days === 0 ? (
                          <span className="text-green-600 font-medium">Today</span>
                        ) : days <= 7 ? (
                          <span className="text-blue-600">{days}d ago</span>
                        ) : days <= 30 ? (
                          <span className="text-gray-600">{days}d ago</span>
                        ) : (
                          <span className="text-orange-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />{days}d ago
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {loadingCust ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#ff6d29]" />
              </div>
            ) : customers.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                No data
              </div>
            ) : customers.map((c, i) => {
              const tier = getTier(Number(c.totalOrders));
              const barPct = maxSpent > 0 ? (Number(c.totalSpent) / maxSpent) * 100 : 0;
              const days = daysSince(c.lastPurchase);
              const hasDue = Number(c.totalDue) > 0;
              return (
                <div key={c.customerId ?? i} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {i < 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${RANK_STYLE[i]}`}>
                          {i + 1}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm w-6 text-center flex-shrink-0">{i + 1}</span>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-[#26272F] truncate">{c.name}</div>
                        {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${tier.bg}`}>
                      {tier.icon} {tier.label}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-[#ff6d29] rounded-full" style={{ width: `${barPct}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Orders</div>
                      <div className="font-semibold">{c.totalOrders}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Spent</div>
                      <div className="font-semibold">{fmtCur(Number(c.totalSpent))}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Due</div>
                      <div className={hasDue ? 'text-red-500 font-semibold' : 'text-gray-400'}>
                        {hasDue ? fmtCur(Number(c.totalDue)) : '—'}
                      </div>
                    </div>
                  </div>
                  {days !== null && (
                    <div className="mt-2 text-xs text-gray-400">
                      Last visit: {days === 0 ? 'Today' : `${days} days ago`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReport;
