import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Search, Loader2, ChevronDown, Package, Wallet, X } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useActiveWarehouse } from '../../hooks/useActiveWarehouse';
import { useCreatePurchaseMutation, useGetAllSuppliersQuery } from './purchaseApi';
import { useGetAllProductsQuery } from '../inventory/products/productApi';
import { useGetAllAccountsQuery } from '../accounting/accountingApi';
import { useDebounce } from '../../hooks/useDebounce';

// ─── Constants & types ────────────────────────────────────────────────────────

const LIMIT = 10;

interface PurchaseItem {
  _id: number;
  productId: string;
  productName: string;
  qty: number;
  unitCost: number;
  discountAmount: number;
  total: number;
  currentStock: number;
}

interface PaymentSplit {
  _id: number;
  accountId: string;
  amount: string;
}

const emptyItem = (): PurchaseItem => ({
  _id: Date.now() + Math.random(),
  productId: '',
  productName: '',
  qty: 1,
  unitCost: 0,
  discountAmount: 0,
  total: 0,
  currentStock: -1,
});

const emptyPayment = (): PaymentSplit => ({ _id: Date.now() + Math.random(), accountId: '', amount: '' });

// ─── ProductSearch ────────────────────────────────────────────────────────────
// Searchable dropdown with infinite scroll — each scroll-to-bottom loads next page.

const ProductSearch = ({
  item,
  warehouseId,
  onSelect,
}: {
  item: PurchaseItem;
  warehouseId: string;
  onSelect: (p: { id: string; name: string; purchasePrice: number; currentStock: number }) => void;
}) => {
  const [query, setQuery] = useState(item.productName);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const { data: productsData, isFetching } = useGetAllProductsQuery(
    { search: debouncedQuery, limit: LIMIT, page },
    { skip: !open || debouncedQuery.length < 1 },
  );

  // Sync display when parent updates product name
  useEffect(() => { setQuery(item.productName); }, [item.productName]);

  // Reset accumulated list when search query changes
  useEffect(() => {
    setPage(1);
    setAllProducts([]);
    setHasMore(false);
  }, [debouncedQuery]);

  // Append page results to accumulated list
  useEffect(() => {
    if (!productsData) return;
    const incoming: any[] = productsData.data ?? [];
    const meta = productsData.meta as any;
    setAllProducts((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
    setHasMore((meta?.currentPage ?? 1) < (meta?.totalPages ?? 1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productsData]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const positionDropdown = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: 320, zIndex: 9999 });
  };

  const handleFocus = () => { positionDropdown(); setOpen(true); };

  // Load next page when user scrolls near the bottom
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (!isFetching && hasMore && scrollHeight - scrollTop - clientHeight < 60) {
        setPage((p) => p + 1);
      }
    },
    [isFetching, hasMore],
  );

  const getStock = (p: any): number => {
    const stocks: any[] = p.stocks ?? [];
    if (!stocks.length) return 0;
    if (warehouseId) {
      const wh = stocks.find((s: any) => s.warehouseId === warehouseId);
      if (wh) return Number(wh.currentQty ?? 0);
    }
    const def = stocks.find((s: any) => s.warehouseId === null);
    if (def) return Number(def.currentQty ?? 0);
    return stocks.reduce((sum: number, s: any) => sum + Number(s.currentQty ?? 0), 0);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search product…"
          onChange={(e) => { setQuery(e.target.value); handleFocus(); }}
          onFocus={handleFocus}
          className="w-full pl-7 pr-3 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29] min-w-[160px]"
        />
      </div>

      {open && (allProducts.length > 0 || isFetching) && (
        <div
          style={dropdownStyle}
          onScroll={handleScroll}
          className="bg-white border border-[#DBDFE9] rounded-lg shadow-xl max-h-52 overflow-y-auto"
        >
          {allProducts.map((p: any) => {
            const stock = getStock(p);
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => {
                  onSelect({ id: p.id, name: p.name, purchasePrice: Number(p.purchasePrice ?? 0), currentStock: Number(stock) });
                  setQuery(p.name);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm border-b border-gray-50 last:border-0"
              >
                <div className="font-medium text-[#26272F]">{p.name}</div>
                <div className="flex items-center justify-between text-xs mt-0.5">
                  <span className="text-gray-400 font-mono">{p.sku ?? ''}</span>
                  <span className="text-[#ff6d29] font-semibold">৳{Number(p.purchasePrice ?? 0).toLocaleString()}</span>
                  <span className={`font-semibold ${stock <= 0 ? 'text-red-500' : stock <= 5 ? 'text-yellow-600' : 'text-gray-500'}`}>
                    Stk: {Number(stock).toFixed(0)}
                  </span>
                </div>
              </button>
            );
          })}

          {isFetching && (
            <div className="flex items-center justify-center py-3 gap-2 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ff6d29]" /> Loading…
            </div>
          )}

          {!isFetching && !hasMore && allProducts.length > 0 && page > 1 && (
            <p className="text-center text-xs text-gray-300 py-2">All results loaded</p>
          )}
        </div>
      )}

      {open && !isFetching && allProducts.length === 0 && debouncedQuery.length > 0 && (
        <div style={dropdownStyle} className="bg-white border border-[#DBDFE9] rounded-lg shadow-xl px-4 py-3 text-sm text-gray-400 text-center">
          No products found
        </div>
      )}
    </div>
  );
};

// ─── SupplierSearch ───────────────────────────────────────────────────────────
// Infinite-scroll supplier picker — same pattern as ProductSearch.

const SupplierSearch = ({
  value,
  onSelect,
  onClear,
}: {
  value: { id: string; name: string } | null;
  onSelect: (s: { id: string; name: string }) => void;
  onClear: () => void;
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const { data: suppliersData, isFetching } = useGetAllSuppliersQuery(
    { search: debouncedQuery, limit: LIMIT, page },
    { skip: !open },
  );

  // Reset accumulated list when search query changes
  useEffect(() => {
    setPage(1);
    setAllSuppliers([]);
    setHasMore(false);
  }, [debouncedQuery]);

  // Append page results
  useEffect(() => {
    if (!suppliersData) return;
    const incoming: any[] = (suppliersData as any).data ?? suppliersData ?? [];
    const meta = (suppliersData as any).meta;
    setAllSuppliers((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
    if (meta) setHasMore((meta.currentPage ?? 1) < (meta.totalPages ?? 1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppliersData]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (!isFetching && hasMore && scrollHeight - scrollTop - clientHeight < 60) {
        setPage((p) => p + 1);
      }
    },
    [isFetching, hasMore],
  );

  const handleClear = () => { onClear(); setQuery(''); setAllSuppliers([]); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        Supplier <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search supplier…"
          value={value ? value.name : query}
          readOnly={!!value}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (!value) setOpen(true); }}
          className={`w-full pl-9 pr-9 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] transition-colors ${
            !value ? 'border-orange-300 bg-orange-50' : 'border-[#DBDFE9] bg-white cursor-default'
          }`}
        />
        {value ? (
          <button type="button" onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        )}
      </div>

      {open && !value && (
        <div
          onScroll={handleScroll}
          className="absolute z-50 top-full left-0 mt-1 bg-white border border-[#DBDFE9] rounded-lg shadow-lg w-full max-h-52 overflow-y-auto"
        >
          {allSuppliers.map((s: any) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={() => { onSelect({ id: s.id, name: s.name }); setQuery(''); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 hover:bg-orange-50 text-sm border-b border-gray-50 last:border-0"
            >
              <div className="font-medium text-[#26272F]">{s.name}</div>
              {s.company && <div className="text-xs text-gray-400">{s.company}</div>}
              {Number(s.currentBalance) > 0 && (
                <div className="text-xs text-red-500">Due: ৳{Number(s.currentBalance).toLocaleString()}</div>
              )}
            </button>
          ))}

          {isFetching && (
            <div className="flex items-center justify-center py-3 gap-2 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ff6d29]" /> Loading…
            </div>
          )}

          {!isFetching && !hasMore && allSuppliers.length > 0 && page > 1 && (
            <p className="text-center text-xs text-gray-300 py-2">All results loaded</p>
          )}

          {!isFetching && allSuppliers.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">No suppliers found</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── PaymentSplits ────────────────────────────────────────────────────────────

const PaymentSplits = ({
  splits,
  accounts,
  grandTotal,
  onChange,
}: {
  splits: PaymentSplit[];
  accounts: any[];
  grandTotal: number;
  onChange: (s: PaymentSplit[]) => void;
}) => {
  const totalPaid = splits.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const due = Math.max(0, grandTotal - totalPaid);

  const update = (_id: number, patch: Partial<PaymentSplit>) =>
    onChange(splits.map((s) => (s._id === _id ? { ...s, ...patch } : s)));

  const remove = (_id: number) => {
    if (splits.length === 1) return;
    onChange(splits.filter((s) => s._id !== _id));
  };

  return (
    <div className="space-y-3 border-t border-[#DBDFE9] pt-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
          <Wallet className="h-3.5 w-3.5 text-[#ff6d29]" /> Payment
        </span>
        {grandTotal > 0 && (
          <div className="flex gap-2">
            <button type="button"
              onClick={() => onChange([{ ...splits[0], amount: String(grandTotal) }])}
              className="text-xs px-2 py-1 border border-green-300 text-green-700 rounded hover:bg-green-50">
              Full Pay
            </button>
            <button type="button"
              onClick={() => onChange([{ _id: splits[0]._id, accountId: '', amount: '' }])}
              className="text-xs px-2 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50">
              Due Only
            </button>
          </div>
        )}
      </div>

      {splits.map((split) => {
        const acc = accounts.find((a) => a.id === split.accountId);
        const splitAmt = Number(split.amount) || 0;
        const balanceAfter = acc ? Number(acc.currentBalance) - splitAmt : null;
        const insufficient = balanceAfter !== null && balanceAfter < 0;

        return (
          <div key={split._id} className="space-y-1">
            <div className="flex gap-2 items-center">
              <select
                value={split.accountId}
                onChange={(e) => update(split._id, { accountId: e.target.value })}
                className={`flex-1 px-2.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] ${
                  split.amount && !split.accountId ? 'border-orange-300 bg-orange-50' : 'border-[#DBDFE9]'
                }`}
              >
                <option value="">— Select account —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.accountType?.replace('_', ' ')}) — ৳{Number(a.currentBalance).toLocaleString()}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={split.amount}
                min="0"
                step="0.01"
                placeholder="0.00"
                onChange={(e) => update(split._id, { amount: e.target.value })}
                className={`w-28 px-2 py-2 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] ${
                  insufficient ? 'border-red-400 bg-red-50' : 'border-[#DBDFE9]'
                }`}
              />
              <button type="button" onClick={() => remove(split._id)} disabled={splits.length === 1}
                className="p-1.5 text-gray-300 hover:text-red-500 disabled:opacity-0 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {acc && split.amount && (
              <p className={`text-xs pl-1 ${insufficient ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {acc.name}: ৳{Number(acc.currentBalance).toLocaleString()} → ৳{balanceAfter!.toLocaleString()}
                {insufficient && ' (insufficient!)'}
              </p>
            )}
          </div>
        );
      })}

      <button type="button" onClick={() => onChange([...splits, emptyPayment()])}
        className="flex items-center gap-1 text-xs text-[#ff6d29] hover:text-[#e65a1f] font-medium">
        <Plus className="h-3.5 w-3.5" /> Add Account
      </button>

      <div className="space-y-1.5 pt-2 border-t border-dashed border-[#DBDFE9]">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Paid</span>
          <span className={`font-semibold ${totalPaid > grandTotal ? 'text-red-500' : 'text-green-600'}`}>
            ৳{totalPaid.toLocaleString()}
          </span>
        </div>
        {totalPaid > grandTotal && (
          <p className="text-xs text-red-500">Paid exceeds grand total by ৳{(totalPaid - grandTotal).toLocaleString()}</p>
        )}
        {due > 0 && totalPaid > 0 && (
          <div className="flex justify-between text-sm font-semibold text-red-500 bg-red-50 px-3 py-2 rounded-lg">
            <span>Due Amount</span><span>৳{due.toLocaleString()}</span>
          </div>
        )}
        {due === 0 && totalPaid > 0 && (
          <div className="flex justify-between text-sm font-semibold text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <span>Fully Paid</span><span>৳{totalPaid.toLocaleString()}</span>
          </div>
        )}
        {totalPaid === 0 && grandTotal > 0 && (
          <div className="flex justify-between text-sm font-semibold text-orange-500 bg-orange-50 px-3 py-2 rounded-lg">
            <span>Full Due</span><span>৳{grandTotal.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── AddPurchase ──────────────────────────────────────────────────────────────

const AddPurchase = () => {
  const navigate = useNavigate();
  const { warehouses, hasWarehouses } = useActiveWarehouse();
  const [createPurchase, { isLoading: isSaving }] = useCreatePurchaseMutation();

  const { data: accountsData } = useGetAllAccountsQuery({});
  const accounts: any[] = accountsData ?? [];

  const [supplier, setSupplier] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState({
    warehouseId: '',
    invoiceNo: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    discountAmount: '',
    taxAmount: '',
    shippingCost: '',
    note: '',
  });

  const [items, setItems] = useState<PurchaseItem[]>([emptyItem()]);
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([emptyPayment()]);

  // ─── Item helpers ─────────────────────────────────────────────────────────

  const calcTotal = (qty: number, cost: number, disc: number) => Math.max(0, qty * cost - disc);

  const updateItem = (_id: number, patch: Partial<PurchaseItem>) =>
    setItems((prev) => prev.map((it) => {
      if (it._id !== _id) return it;
      const u = { ...it, ...patch };
      u.total = calcTotal(u.qty, u.unitCost, u.discountAmount);
      return u;
    }));

  const selectProduct = (_id: number, p: { id: string; name: string; purchasePrice: number; currentStock: number }) =>
    setItems((prev) => prev.map((it) => {
      if (it._id !== _id) return it;
      const u = { ...it, productId: p.id, productName: p.name, unitCost: p.purchasePrice, currentStock: p.currentStock };
      u.total = calcTotal(u.qty, u.unitCost, u.discountAmount);
      return u;
    }));

  // ─── Totals ───────────────────────────────────────────────────────────────

  const itemsSubtotal = items.reduce((s, i) => s + i.total, 0);
  const extraDiscount = Number(form.discountAmount) || 0;
  const tax = Number(form.taxAmount) || 0;
  const shipping = Number(form.shippingCost) || 0;
  const grandTotal = itemsSubtotal - extraDiscount + tax + shipping;
  const totalPaid = paymentSplits.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!supplier) { toast.error('Supplier is required'); return; }
    if (items.some((i) => !i.productId)) { toast.error('Select a product for every row'); return; }
    if (items.some((i) => i.qty <= 0)) { toast.error('Quantity must be greater than 0'); return; }
    if (items.some((i) => i.unitCost <= 0)) { toast.error('Unit cost must be greater than 0'); return; }

    const activeSplits = paymentSplits.filter((p) => Number(p.amount) > 0);
    if (activeSplits.some((p) => !p.accountId)) { toast.error('Select an account for every payment row'); return; }
    if (totalPaid > grandTotal + 0.01) { toast.error('Total paid exceeds grand total'); return; }

    const payload = {
      supplierId: supplier.id,
      warehouseId: form.warehouseId || undefined,
      invoiceNo: form.invoiceNo || undefined,
      purchaseDate: form.purchaseDate,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.qty,
        unitCost: i.unitCost,
        discountAmount: i.discountAmount || undefined,
      })),
      discountAmount: extraDiscount || undefined,
      taxAmount: tax || undefined,
      shippingCost: shipping || undefined,
      payments: activeSplits.length > 0
        ? activeSplits.map((p) => ({ accountId: p.accountId, amount: Number(p.amount) }))
        : undefined,
      note: form.note || undefined,
    };

    try {
      await createPurchase(payload).unwrap();
      toast.success('Purchase saved successfully');
      navigate('/admin/purchase/list');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to save purchase');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Add Purchase"
        subtitle="Create a new purchase order"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Purchase', path: '/admin/purchase/list' },
          { label: 'Add Purchase' },
        ]}
        actions={
          <Link to="/admin/purchase/list"
            className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Form ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Purchase Info */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Purchase Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="sm:col-span-2">
                <SupplierSearch
                  value={supplier}
                  onSelect={setSupplier}
                  onClear={() => setSupplier(null)}
                />
              </div>

              {hasWarehouses && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Warehouse <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <select
                    value={form.warehouseId}
                    onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                  >
                    <option value="">Business Default</option>
                    {warehouses.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Invoice No.</label>
                <input
                  type="text"
                  value={form.invoiceNo}
                  onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                  placeholder="Auto-generated if blank"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#26272F]">Purchase Items</h3>
              <button type="button" onClick={() => setItems((p) => [...p, emptyItem()])}
                className="flex items-center gap-1.5 text-xs text-[#ff6d29] hover:text-[#e65a1f] font-medium">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DBDFE9]">
                    {['Product', 'Qty', 'Unit Cost (৳)', 'Disc (৳)', 'Total', ''].map((h) => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id} className="border-b border-gray-50">
                      <td className="py-2 pr-3">
                        <ProductSearch
                          item={item}
                          warehouseId={form.warehouseId}
                          onSelect={(p) => selectProduct(item._id, p)}
                        />
                        {item.productId && item.currentStock >= 0 && (
                          <div className="mt-1">
                            <span className={`text-xs font-medium flex items-center gap-1 ${
                              item.currentStock === 0 ? 'text-red-500' : item.currentStock <= 5 ? 'text-yellow-600' : 'text-gray-400'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {item.currentStock === 0 ? 'Out of stock' : `Stock: ${item.currentStock}`}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          value={item.qty}
                          min="0.0001"
                          step="1"
                          onChange={(e) => updateItem(item._id, { qty: Number(e.target.value) })}
                          className="w-16 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm text-center focus:outline-none focus:border-[#ff6d29]"
                        />
                        {item.productId && item.currentStock >= 0 && (
                          <p className="text-xs mt-0.5 text-center text-gray-400">→ {item.currentStock + item.qty}</p>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          value={item.unitCost}
                          min="0"
                          step="0.01"
                          onChange={(e) => updateItem(item._id, { unitCost: Number(e.target.value) })}
                          className="w-24 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          value={item.discountAmount}
                          min="0"
                          step="0.01"
                          onChange={(e) => updateItem(item._id, { discountAmount: Number(e.target.value) })}
                          className="w-20 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]"
                        />
                      </td>
                      <td className="py-2 pr-3 font-semibold text-[#26272F] whitespace-nowrap">
                        ৳{item.total.toLocaleString()}
                      </td>
                      <td className="py-2">
                        <button type="button"
                          onClick={() => { if (items.length > 1) setItems((p) => p.filter((i) => i._id !== item._id)); }}
                          disabled={items.length === 1}
                          className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {items.every((i) => !i.productId) && (
              <div className="mt-4 py-6 text-center text-gray-400">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">Search and add products above</p>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Note (Optional)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Internal note…"
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none"
            />
          </div>
        </div>

        {/* ── Right: Summary ── */}
        <div>
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 sticky top-4">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Order Summary</h3>

            <div className="space-y-2.5 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span>৳{itemsSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Discount (৳)</span>
                <input type="number" min="0" value={form.discountAmount} placeholder="0"
                  onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                  className="w-24 px-2 py-1 text-right border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]" />
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Tax (৳)</span>
                <input type="number" min="0" value={form.taxAmount} placeholder="0"
                  onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
                  className="w-24 px-2 py-1 text-right border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]" />
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Shipping (৳)</span>
                <input type="number" min="0" value={form.shippingCost} placeholder="0"
                  onChange={(e) => setForm({ ...form, shippingCost: e.target.value })}
                  className="w-24 px-2 py-1 text-right border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]" />
              </div>
              <div className="border-t border-[#DBDFE9] pt-2 flex justify-between font-bold text-[#26272F] text-base">
                <span>Grand Total</span>
                <span>৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <PaymentSplits
              splits={paymentSplits}
              accounts={accounts}
              grandTotal={grandTotal}
              onChange={setPaymentSplits}
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 transition-colors"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Saving…' : 'Save Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPurchase;
