import { useState, useMemo } from 'react';
import { Download, Package, Search, Warehouse } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useGetStockPositionReportQuery } from './reportsApi';
import { useGetAllCategoryQuery } from '../inventory/category/categoryApi';

type ViewMode = 'business' | 'warehouse';
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

const fmt = (n: number) => n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtQty = (n: number) => n % 1 === 0 ? n.toLocaleString() : n.toFixed(2);

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  out_of_stock: { label: 'Out of Stock', cls: 'bg-red-100 text-red-600' },
  low_stock:    { label: 'Low Stock',    cls: 'bg-amber-100 text-amber-600' },
  in_stock:     { label: 'In Stock',     cls: 'bg-green-100 text-green-700' },
};

function getStockStatus(qty: number, alertQty: number | null): 'out_of_stock' | 'low_stock' | 'in_stock' {
  if (qty <= 0) return 'out_of_stock';
  if (alertQty != null && qty <= alertQty) return 'low_stock';
  return 'in_stock';
}

const StockPositionReport = () => {
  const [view, setView] = useState<ViewMode>('business');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: raw, isFetching } = useGetStockPositionReportQuery(
    { search: debouncedSearch || undefined, categoryId: categoryId || undefined },
    { refetchOnMountOrArgChange: true }
  );
  const { data: catRaw } = useGetAllCategoryQuery({ limit: 200 });

  const categories: any[] = Array.isArray(catRaw) ? catRaw : (catRaw as any)?.data ?? [];

  const report = raw as any;
  const locations: any[] = report?.locations ?? [];
  const summary = report?.summary ?? {};

  const warehouseLocations = locations.filter((l: any) => !l.isDefault);
  const defaultLocation = locations.find((l: any) => l.isDefault);

  const allProducts: any[] = useMemo(() => {
    const prods: any[] = report?.products ?? [];
    if (stockFilter === 'all') return prods;
    return prods.filter((p: any) => getStockStatus(p.totalQty, p.alertQuantity) === stockFilter);
  }, [report, stockFilter]);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    clearTimeout((window as any).__stockSearchTimer);
    (window as any).__stockSearchTimer = setTimeout(() => setDebouncedSearch(v), 350);
  };

  const handleExport = () => {
    const headers = ['Product', 'SKU', 'Category', 'Total Qty', 'Stock Value (৳)', 'Status'];
    const rows = allProducts.map((p: any) => [
      p.name, p.sku, p.categoryName, fmtQty(p.totalQty), fmt(p.totalValue),
      getStockStatus(p.totalQty, p.alertQuantity),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-position-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Stock Position Report"
        subtitle="Current stock levels by business and warehouse"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Reports' },
          { label: 'Stock Position' },
        ]}
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">{summary.totalProducts ?? 0}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600">Total Stock Qty</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{fmtQty(summary.totalQty ?? 0)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-xs text-emerald-600">Total Stock Value</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">৳{fmt(summary.totalValue ?? 0)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-500">Low / Out of Stock</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {(summary.lowStockCount ?? 0) + (summary.outOfStockCount ?? 0)}
          </p>
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search product name or SKU…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#DBDFE9] rounded-lg focus:outline-none focus:border-[#ff6d29]"
            />
          </div>

          {/* Category */}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 text-sm border border-[#DBDFE9] rounded-lg focus:outline-none focus:border-[#ff6d29] bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Stock Status */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            className="px-3 py-2 text-sm border border-[#DBDFE9] rounded-lg focus:outline-none focus:border-[#ff6d29] bg-white"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* View Toggle */}
          <div className="flex border border-[#DBDFE9] rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setView('business')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                view === 'business'
                  ? 'bg-[#ff6d29] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Business</span>
            </button>
            <button
              onClick={() => setView('warehouse')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                view === 'warehouse'
                  ? 'bg-[#ff6d29] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Warehouse className="h-4 w-4" />
              <span className="hidden sm:inline">By Warehouse</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#26272F]">
            {view === 'business' ? 'Business Stock Summary' : 'Stock by Warehouse'}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{allProducts.length} products</span>
            {isFetching && <div className="w-4 h-4 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" />}
          </div>
        </div>

        <div className="overflow-x-auto">
          {view === 'business' ? (
            <BusinessView products={allProducts} isFetching={isFetching} />
          ) : (
            <WarehouseView
              products={allProducts}
              defaultLocation={defaultLocation}
              warehouseLocations={warehouseLocations}
              isFetching={isFetching}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Business Summary Table ─── */
function BusinessView({ products, isFetching }: { products: any[]; isFetching: boolean }) {
  const cols = ['Product', 'SKU', 'Category', 'Unit', 'Total Qty', 'Avg Cost (৳)', 'Stock Value (৳)', 'Status'];
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-[#DBDFE9]">
          {cols.map((h) => (
            <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {isFetching ? (
          <tr><td colSpan={cols.length} className="px-4 py-12 text-center">
            <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
          </td></tr>
        ) : products.length === 0 ? (
          <tr><td colSpan={cols.length} className="px-4 py-16 text-center text-gray-400">
            <Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />
            No products found
          </td></tr>
        ) : products.map((p: any) => {
          const status = getStockStatus(p.totalQty, p.alertQuantity);
          const { label, cls } = STATUS_CONFIG[status];
          return (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-[#26272F] whitespace-nowrap max-w-[180px] truncate">{p.name}</td>
              <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">{p.sku || '—'}</td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.categoryName}</td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.unitName}</td>
              <td className="px-4 py-3 font-semibold text-[#26272F] whitespace-nowrap">{fmtQty(p.totalQty)}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {/* weighted avg across locations — just show primary cost */}
                {p.totalQty > 0 ? fmt(p.totalValue / p.totalQty) : '—'}
              </td>
              <td className="px-4 py-3 font-semibold text-blue-700 whitespace-nowrap">৳{fmt(p.totalValue)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{label}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
      {products.length > 0 && !isFetching && (
        <tfoot>
          <tr className="bg-gray-50 border-t-2 border-[#DBDFE9] font-semibold">
            <td colSpan={4} className="px-4 py-3 text-gray-600 text-xs uppercase">Total</td>
            <td className="px-4 py-3 text-[#26272F]">
              {fmtQty(products.reduce((s, p) => s + p.totalQty, 0))}
            </td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-blue-700">
              ৳{fmt(products.reduce((s, p) => s + p.totalValue, 0))}
            </td>
            <td className="px-4 py-3" />
          </tr>
        </tfoot>
      )}
    </table>
  );
}

/* ─── Warehouse Breakdown Table ─── */
function WarehouseView({
  products,
  defaultLocation,
  warehouseLocations,
  isFetching,
}: {
  products: any[];
  defaultLocation: any;
  warehouseLocations: any[];
  isFetching: boolean;
}) {
  const allLocs = defaultLocation ? [defaultLocation, ...warehouseLocations] : warehouseLocations;
  const colCount = 3 + allLocs.length + 1; // # | Product | SKU | ...locations | Total

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-[#DBDFE9]">
          <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">Product</th>
          <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">SKU</th>
          {defaultLocation && (
            <th className="px-4 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap bg-blue-50">
              Business Default
            </th>
          )}
          {warehouseLocations.map((loc: any) => (
            <th key={loc.id} className="px-4 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
              {loc.warehouseName ?? loc.name}
            </th>
          ))}
          <th className="px-4 py-3 text-center font-semibold text-[#26272F] text-xs uppercase tracking-wide whitespace-nowrap bg-gray-100">
            Total
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {isFetching ? (
          <tr><td colSpan={colCount} className="px-4 py-12 text-center">
            <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
          </td></tr>
        ) : products.length === 0 ? (
          <tr><td colSpan={colCount} className="px-4 py-16 text-center text-gray-400">
            <Package className="h-10 w-10 mx-auto mb-2 text-gray-200" />
            No products found
          </td></tr>
        ) : products.map((p: any) => {
          const status = getStockStatus(p.totalQty, p.alertQuantity);
          return (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-[#26272F] whitespace-nowrap max-w-[200px] truncate">
                <div className="flex items-center gap-2">
                  <span>{p.name}</span>
                  {status !== 'in_stock' && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_CONFIG[status].cls}`}>
                      {STATUS_CONFIG[status].label}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">{p.sku || '—'}</td>
              {defaultLocation && (
                <td className="px-4 py-3 text-center text-[#26272F] font-medium bg-blue-50/40 whitespace-nowrap">
                  {fmtQty(p.stocks?.[defaultLocation.id]?.qty ?? 0)}
                </td>
              )}
              {warehouseLocations.map((loc: any) => (
                <td key={loc.id} className="px-4 py-3 text-center text-gray-600 whitespace-nowrap">
                  {fmtQty(p.stocks?.[loc.id]?.qty ?? 0)}
                </td>
              ))}
              <td className="px-4 py-3 text-center font-bold text-[#26272F] bg-gray-50 whitespace-nowrap">
                {fmtQty(p.totalQty)}
              </td>
            </tr>
          );
        })}
      </tbody>
      {products.length > 0 && !isFetching && (
        <tfoot>
          <tr className="bg-gray-50 border-t-2 border-[#DBDFE9] font-semibold text-xs">
            <td colSpan={2} className="px-4 py-3 text-gray-500 uppercase">Total</td>
            {defaultLocation && (
              <td className="px-4 py-3 text-center bg-blue-50/40">
                {fmtQty(products.reduce((s, p) => s + (p.stocks?.[defaultLocation.id]?.qty ?? 0), 0))}
              </td>
            )}
            {warehouseLocations.map((loc: any) => (
              <td key={loc.id} className="px-4 py-3 text-center">
                {fmtQty(products.reduce((s, p) => s + (p.stocks?.[loc.id]?.qty ?? 0), 0))}
              </td>
            ))}
            <td className="px-4 py-3 text-center bg-gray-100">
              {fmtQty(products.reduce((s, p) => s + p.totalQty, 0))}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

export default StockPositionReport;
