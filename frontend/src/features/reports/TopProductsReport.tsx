import { useState, useMemo } from 'react';
import {
  Package, TrendingUp, Download, Loader2, ShoppingCart,
  BarChart2, Tag, ArrowUpDown,
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import {
  useGetTopProductsQuery,
  useGetSalesSummaryQuery,
  useGetCategorySalesQuery,
  useGetPaymentMethodsQuery,
} from './reportsApi';

// ── helpers ──────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split('T')[0];

const fmt = (n: number) => n.toLocaleString('en-BD');
const fmtCur = (n: number) => `৳${fmt(n)}`;
const pct = (part: number, total: number) =>
  total > 0 ? ((part / total) * 100).toFixed(1) : '0.0';

type SortKey = 'totalRevenue' | 'totalQty' | 'totalProfit';

const RANK_STYLE = [
  'bg-yellow-400 text-yellow-900',   // #1 gold
  'bg-gray-300 text-gray-700',       // #2 silver
  'bg-amber-600 text-amber-100',     // #3 bronze
];

const MARGIN_COLOR = (margin: number) => {
  if (margin >= 20) return 'text-green-600';
  if (margin >= 10) return 'text-orange-500';
  return 'text-red-500';
};

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash', card: 'Card', mobile_banking: 'Mobile Banking',
  bank_transfer: 'Bank Transfer', split: 'Split', unknown: 'Unknown',
};
const METHOD_COLOR: Record<string, string> = {
  cash: 'bg-green-500', card: 'bg-blue-500', mobile_banking: 'bg-purple-500',
  bank_transfer: 'bg-indigo-500', split: 'bg-orange-500', unknown: 'bg-gray-400',
};

// ── CSV export ────────────────────────────────────────────────────────────────

const exportCSV = (products: any[], dateFrom: string, dateTo: string) => {
  const header = ['Rank', 'Product', 'SKU', 'Qty Sold', 'Revenue (৳)', 'Profit (৳)', 'Margin %'];
  const rows = products.map((p, i) => [
    i + 1, p.productName, p.sku || '', p.totalQty,
    p.totalRevenue, p.totalProfit,
    p.totalRevenue > 0 ? ((p.totalProfit / p.totalRevenue) * 100).toFixed(1) : '0',
  ]);
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `top-products-${dateFrom}-${dateTo}.csv`;
  a.click();
};

// ── component ─────────────────────────────────────────────────────────────────

const TopProductsReport = () => {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [sortBy, setSortBy] = useState<SortKey>('totalRevenue');
  const [limit, setLimit] = useState(20);

  const params = { dateFrom, dateTo };

  const { data: rawProducts, isFetching: loadingProducts } =
    useGetTopProductsQuery({ ...params, limit: 50 });
  const { data: summary, isFetching: loadingSummary } =
    useGetSalesSummaryQuery(params);
  const { data: rawCategories, isFetching: loadingCat } =
    useGetCategorySalesQuery(params);
  const { data: rawPayMethods, isFetching: loadingPay } =
    useGetPaymentMethodsQuery(params);

  const isFetching = loadingProducts || loadingSummary || loadingCat || loadingPay;

  const products: any[] = useMemo(() => {
    const list: any[] = Array.isArray(rawProducts) ? rawProducts : [];
    return [...list]
      .sort((a, b) => Number(b[sortBy]) - Number(a[sortBy]))
      .slice(0, limit);
  }, [rawProducts, sortBy, limit]);

  const categories: any[] = Array.isArray(rawCategories) ? rawCategories : [];
  const payMethods: any[] = Array.isArray(rawPayMethods) ? rawPayMethods : [];

  const totalRevenue = Number(summary?.totalRevenue ?? 0);
  const totalProfit = Number(summary?.totalProfit ?? 0);
  const maxProductRevenue = products[0] ? Number(products[0][sortBy]) : 1;

  const totalUnits = products.reduce((s, p) => s + Number(p.totalQty), 0);
  const avgMargin =
    totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const maxCatRevenue =
    categories.length > 0 ? Math.max(...categories.map((c) => Number(c.totalRevenue))) : 1;
  const maxPayTotal =
    payMethods.length > 0 ? Math.max(...payMethods.map((p) => Number(p.total))) : 1;

  const SORT_TABS: { key: SortKey; label: string }[] = [
    { key: 'totalRevenue', label: 'By Revenue' },
    { key: 'totalQty', label: 'By Quantity' },
    { key: 'totalProfit', label: 'By Profit' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Top Products Report"
        subtitle="Best-selling products by revenue, quantity, and profit margin"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'Reports' },
          { label: 'Top Products' },
        ]}
        actions={
          <button
            onClick={() => exportCSV(products, dateFrom, dateTo)}
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
            label: 'Total Revenue', value: fmtCur(totalRevenue),
            icon: <TrendingUp className="h-5 w-5 text-[#ff6d29]" />,
            bg: 'bg-orange-50 border-orange-200',
          },
          {
            label: 'Gross Profit', value: fmtCur(totalProfit),
            icon: <TrendingUp className="h-5 w-5 text-green-600" />,
            bg: 'bg-green-50 border-green-200',
          },
          {
            label: 'Units Sold', value: fmt(totalUnits),
            icon: <ShoppingCart className="h-5 w-5 text-blue-500" />,
            bg: 'bg-blue-50 border-blue-200',
          },
          {
            label: 'Avg Profit Margin', value: `${avgMargin}%`,
            icon: <BarChart2 className="h-5 w-5 text-purple-500" />,
            bg: 'bg-purple-50 border-purple-200',
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

      {/* Main table + mini charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Top Products table (takes 2/3 width on xl) ── */}
        <div className="xl:col-span-2 bg-white border border-[#DBDFE9] rounded-xl shadow-sm overflow-hidden">
          {/* Sort tabs */}
          <div className="px-4 py-3 border-b border-[#DBDFE9] flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-semibold text-[#26272F]">Top Products</span>
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
                  {['#', 'Product', 'Qty', 'Revenue', 'Profit', 'Margin', 'Share'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingProducts ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                      <Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No product sales in this period
                    </td>
                  </tr>
                ) : products.map((p, i) => {
                  const margin = p.totalRevenue > 0
                    ? (p.totalProfit / p.totalRevenue) * 100 : 0;
                  const barPct = maxProductRevenue > 0
                    ? (Number(p[sortBy]) / maxProductRevenue) * 100 : 0;
                  const revShare = pct(Number(p.totalRevenue), totalRevenue);

                  return (
                    <tr key={p.productId ?? i} className="hover:bg-gray-50 transition-colors">
                      {/* Rank badge */}
                      <td className="px-4 py-3">
                        {i < 3 ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${RANK_STYLE[i]}`}>
                            {i + 1}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm pl-1">{i + 1}</span>
                        )}
                      </td>
                      {/* Product name + SKU + bar */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="font-medium text-[#26272F] truncate">{p.productName}</div>
                        {p.sku && (
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{p.sku}</div>
                        )}
                        {/* inline bar */}
                        <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden w-full">
                          <div
                            className="h-full bg-[#ff6d29] rounded-full transition-all duration-500"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">{fmt(Number(p.totalQty))}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums">{fmtCur(Number(p.totalRevenue))}</td>
                      <td className="px-4 py-3 text-green-600 tabular-nums">{fmtCur(Number(p.totalProfit))}</td>
                      <td className={`px-4 py-3 font-semibold tabular-nums ${MARGIN_COLOR(margin)}`}>
                        {margin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {revShare}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-gray-100">
            {loadingProducts ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#ff6d29]" />
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                No data
              </div>
            ) : products.map((p, i) => {
              const margin = p.totalRevenue > 0 ? (p.totalProfit / p.totalRevenue) * 100 : 0;
              const barPct = maxProductRevenue > 0
                ? (Number(p[sortBy]) / maxProductRevenue) * 100 : 0;
              return (
                <div key={p.productId ?? i} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {i < 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${RANK_STYLE[i]}`}>
                          {i + 1}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm w-6 text-center flex-shrink-0">{i + 1}</span>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-[#26272F] truncate">{p.productName}</div>
                        {p.sku && <div className="text-xs text-gray-400 font-mono">{p.sku}</div>}
                      </div>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      {pct(Number(p.totalRevenue), totalRevenue)}%
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-[#ff6d29] rounded-full" style={{ width: `${barPct}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Qty</div>
                      <div className="font-semibold">{fmt(Number(p.totalQty))}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Revenue</div>
                      <div className="font-semibold">{fmtCur(Number(p.totalRevenue))}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Margin</div>
                      <div className={`font-semibold ${MARGIN_COLOR(margin)}`}>{margin.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Side panels (category + payment) ── */}
        <div className="flex flex-col gap-5">

          {/* Category breakdown */}
          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#DBDFE9] flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-[#26272F]">By Category</h3>
              {loadingCat && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ff6d29] ml-auto" />}
            </div>
            <div className="p-4 space-y-3">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No category data</p>
              ) : categories.map((cat, i) => {
                const catBarPct = maxCatRevenue > 0
                  ? (Number(cat.totalRevenue) / maxCatRevenue) * 100 : 0;
                const catShare = pct(Number(cat.totalRevenue), totalRevenue);
                const COLORS = [
                  'bg-[#ff6d29]', 'bg-blue-500', 'bg-green-500',
                  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-amber-500',
                ];
                return (
                  <div key={cat.categoryId ?? i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 truncate pr-2">{cat.categoryName}</span>
                      <span className="text-gray-500 flex-shrink-0">{catShare}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${COLORS[i % COLORS.length]}`}
                        style={{ width: `${catBarPct}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{fmtCur(Number(cat.totalRevenue))}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment method breakdown */}
          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#DBDFE9] flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-[#26272F]">Payment Methods</h3>
              {loadingPay && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ff6d29] ml-auto" />}
            </div>
            <div className="p-4 space-y-3">
              {payMethods.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No data</p>
              ) : payMethods.map((m, i) => {
                const payBarPct = maxPayTotal > 0
                  ? (Number(m.total) / maxPayTotal) * 100 : 0;
                const payShare = pct(Number(m.total), totalRevenue);
                return (
                  <div key={m.method ?? i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">
                        {METHOD_LABEL[m.method] ?? m.method}
                      </span>
                      <span className="text-gray-500">{m.count} orders · {payShare}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${METHOD_COLOR[m.method] ?? 'bg-gray-400'}`}
                        style={{ width: `${payBarPct}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{fmtCur(Number(m.total))}</div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TopProductsReport;
