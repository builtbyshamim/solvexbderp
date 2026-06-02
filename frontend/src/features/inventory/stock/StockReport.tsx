import { useMemo, useState } from 'react';
import { Search, Download, BookOpen, ChevronDown } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import { useLanguage } from '../../../context/LanguageContext';
import { useGetStockLedgerQuery } from './stockApi';
import { useGetAllProductsQuery } from '../products/productApi';
import { useGetStockLocationsQuery } from './stockLocationApi';
import CommonPagination from '../../../components/ui/paginations/CommonPagination';

const TRANSACTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'OPENING', label: 'Opening' },
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'SALE', label: 'Sale' },
  { value: 'ADJUSTMENT_IN', label: 'Adj +' },
  { value: 'ADJUSTMENT_OUT', label: 'Adj −' },
  { value: 'TRANSFER_IN', label: 'Transfer In' },
  { value: 'TRANSFER_OUT', label: 'Transfer Out' },
  { value: 'RETURN_IN', label: 'Return In' },
  { value: 'RETURN_OUT', label: 'Return Out' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'LOST', label: 'Lost' },
];

const typeConfig: Record<string, { label: string; cls: string }> = {
  OPENING: { label: 'Opening', cls: 'bg-gray-100 text-gray-600' },
  PURCHASE: { label: 'Purchase', cls: 'bg-blue-100 text-blue-700' },
  SALE: { label: 'Sale', cls: 'bg-orange-100 text-orange-700' },
  ADJUSTMENT_IN: { label: 'Adj +', cls: 'bg-green-100 text-green-700' },
  ADJUSTMENT_OUT: { label: 'Adj −', cls: 'bg-red-100 text-red-600' },
  TRANSFER_IN: { label: 'Transfer In', cls: 'bg-purple-100 text-purple-700' },
  TRANSFER_OUT: { label: 'Transfer Out', cls: 'bg-yellow-100 text-yellow-700' },
  RETURN_IN: { label: 'Return In', cls: 'bg-teal-100 text-teal-700' },
  RETURN_OUT: { label: 'Return Out', cls: 'bg-pink-100 text-pink-700' },
};

const today = new Date();
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
const todayStr = today.toISOString().split('T')[0];

const StockReport = () => {
  const { t } = useLanguage();
  const [paginate, setPaginate] = useState({ page: 1, limit: 20 });

  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(todayStr);
  const [productId, setProductId] = useState('');
  const [productLabel, setProductLabel] = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const queryParams = {
    page: paginate.page,
    limit: paginate.limit,
    ...(locationId && { locationId }),
    ...(transactionType && { transactionType }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(productId && { productId }),
    ...(search && { search }),
  };

  const { data: ledgerData, isFetching } = useGetStockLedgerQuery(queryParams);
  const { data: locData } = useGetStockLocationsQuery(undefined);
  const { data: productData } = useGetAllProductsQuery({ limit: 500 });
  console.log('Stock ledger query params:', ledgerData);

  const entries = ledgerData?.data || [];
  const meta = ledgerData?.meta || { totalItems: 0, totalPages: 1 };
  const locations: any[] = Array.isArray(locData) ? locData : locData?.data || [];
  const allProducts: any[] = productData?.data || [];

  const locationMap = useMemo(
    () => Object.fromEntries(locations.map((l: any) => [l.id, l.name])),
    [locations],
  );
  const productMap = useMemo(
    () => Object.fromEntries(allProducts.map((p: any) => [p.id, { name: p.name, sku: p.sku }])),
    [allProducts],
  );

  const filteredProducts = useMemo(
    () =>
      allProducts.filter(
        (p: any) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.sku || '').toLowerCase().includes(productSearch.toLowerCase()),
      ),
    [allProducts, productSearch],
  );

  const totalIn = entries.reduce((s: number, e: any) => s + Number(e.qtyIn), 0);
  const totalOut = entries.reduce((s: number, e: any) => s + Number(e.qtyOut), 0);

  const handleReset = () => {
    setSearch('');
    setLocationId('');
    setTransactionType('');
    setDateFrom(firstOfMonth);
    setDateTo(todayStr);
    setProductId('');
    setProductLabel('');
    setPaginate((p) => ({ ...p, page: 1 }));
  };

  const selectProduct = (p: any) => {
    setProductId(p.id);
    setProductLabel(`${p.name} (${p.sku || ''})`);
    setShowProductDrop(false);
    setProductSearch('');
    setPaginate((p) => ({ ...p, page: 1 }));
  };

  return (
    <div>
      <PageHeader
        title="Stock Ledger"
        subtitle="Immutable record of all stock movements"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.inventory'), path: '/admin/inventory/products' },
          { label: 'Stock Ledger' },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-0.5">Entries</div>
          <div className="text-xl font-bold text-[#26272F]">{meta.totalItems}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-xs text-green-600 mb-0.5">Total In</div>
          <div className="text-xl font-bold text-green-700">+{totalIn}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-xs text-red-500 mb-0.5">Total Out</div>
          <div className="text-xl font-bold text-red-600">-{totalOut}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg p-4 mb-4 space-y-3">
        {/* Row 1: search + warehouse + type */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPaginate((p) => ({ ...p, page: 1 }));
              }}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
          <select
            value={locationId}
            onChange={(e) => {
              setLocationId(e.target.value);
              setPaginate((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] sm:w-44"
          >
            <option value="">All Locations</option>
            {locations.map((l: any) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {l.isDefault ? ' ★' : ''}
              </option>
            ))}
          </select>
          <select
            value={transactionType}
            onChange={(e) => {
              setTransactionType(e.target.value);
              setPaginate((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] sm:w-40"
          >
            {TRANSACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Row 2: product + date range + reset */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Product filter */}
          <div className="relative sm:w-52">
            <button
              type="button"
              onClick={() => setShowProductDrop((v) => !v)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            >
              <span className={`truncate ${productLabel ? 'text-[#26272F]' : 'text-gray-400'}`}>
                {productLabel || 'All Products'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-1" />
            </button>
            {showProductDrop && (
              <div className="absolute z-10 mt-1 w-full min-w-[220px] bg-white border border-[#DBDFE9] rounded-lg shadow-lg">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#ff6d29]"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setProductId('');
                      setProductLabel('');
                      setShowProductDrop(false);
                      setPaginate((p) => ({ ...p, page: 1 }));
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                  >
                    All Products
                  </button>
                  {filteredProducts.slice(0, 50).map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProduct(p)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="text-sm text-[#26272F] truncate">{p.name}</span>
                      <span className="text-xs text-gray-400 font-mono flex-shrink-0 ml-2">
                        {p.sku}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 flex-1">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPaginate((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
            <span className="flex-shrink-0">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPaginate((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm text-gray-500 border border-[#DBDFE9] rounded-lg hover:bg-gray-50 whitespace-nowrap"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-[#DBDFE9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#ff6d29]" />
            <span className="text-sm font-semibold text-[#26272F]">Stock Ledger</span>
            <span className="text-xs text-gray-400 ml-1 hidden sm:inline">
              — append-only, read-only
            </span>
          </div>
          <span className="text-sm text-gray-500">{meta.totalItems} entries</span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {[
                  'Date & Time',
                  'Product',
                  'Warehouse',
                  'Type',
                  'Reference',
                  'In',
                  'Out',
                  'Balance',
                  'Note',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    No ledger entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry: any) => {
                  const prod = productMap[entry.productId];
                  const wh = locationMap[entry.locationId];
                  const tc = typeConfig[entry.transactionType];
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#26272F] whitespace-nowrap">
                          {prod?.name ?? '—'}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{prod?.sku ?? ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{wh ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${tc?.cls ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {tc?.label ?? entry.transactionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#ff6d29] whitespace-nowrap">
                        {entry.referenceId ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-green-600 font-semibold">
                        {Number(entry.qtyIn) > 0 ? `+${Number(entry.qtyIn)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-red-500 font-semibold">
                        {Number(entry.qtyOut) > 0 ? `−${Number(entry.qtyOut)}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#26272F]">
                        {Number(entry.balanceAfter)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">
                        {entry.note || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden divide-y divide-gray-100">
          {isFetching ? (
            <div className="py-10 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              No ledger entries found
            </div>
          ) : (
            entries.map((entry: any) => {
              const prod = productMap[entry.productId];
              const wh = locationMap[entry.locationId];
              const tc = typeConfig[entry.transactionType];
              return (
                <div key={entry.id} className="p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-[#26272F]">{prod?.name ?? '—'}</div>
                      <div className="text-xs text-gray-400 font-mono">{prod?.sku ?? ''}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${tc?.cls ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {tc?.label ?? entry.transactionType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 text-xs">
                      {wh ?? '—'} · {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {Number(entry.qtyIn) > 0 && (
                      <span className="text-green-600 font-semibold">
                        In: +{Number(entry.qtyIn)}
                      </span>
                    )}
                    {Number(entry.qtyOut) > 0 && (
                      <span className="text-red-500 font-semibold">
                        Out: −{Number(entry.qtyOut)}
                      </span>
                    )}
                    <span className="text-[#26272F] font-bold ml-auto">
                      Bal: {Number(entry.balanceAfter)}
                    </span>
                  </div>
                  {entry.referenceId && (
                    <div className="text-xs font-mono text-[#ff6d29]">{entry.referenceId}</div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {meta.totalPages > 1 && (
          <CommonPagination
            total={meta.totalItems}
            totalPage={meta.totalPages}
            setSearchValue={setPaginate}
            searchValue={paginate}
            limit={paginate.limit}
            page={paginate.page}
          />
        )}
      </div>
    </div>
  );
};

export default StockReport;
