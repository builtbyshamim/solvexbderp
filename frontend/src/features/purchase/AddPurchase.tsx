import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Search, Loader2, ChevronDown, Package } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useActiveWarehouse } from '../../hooks/useActiveWarehouse';
import { useCreatePurchaseMutation, useGetAllSuppliersQuery } from './purchaseApi';
import { useGetAllProductsQuery } from '../inventory/products/productApi';
import { useDebounce } from '../../hooks/useDebounce';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Product Search ────────────────────────────────────────────────────────────

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
  const ref = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const { data: productsData } = useGetAllProductsQuery(
    { search: debouncedQuery, limit: 10 },
    { skip: debouncedQuery.length < 1 },
  );
  const products: any[] = productsData?.data ?? [];

  useEffect(() => { setQuery(item.productName); }, [item.productName]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getStock = (p: any) => {
    if (!warehouseId) {
      return (p.stocks ?? []).reduce((s: number, st: any) => s + Number(st.currentQty ?? 0), 0);
    }
    return Number(p.stocks?.find((s: any) => s.warehouseId === warehouseId)?.currentQty ?? 0);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text"
          value={query}
          placeholder="Search product…"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full pl-7 pr-3 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29] min-w-[160px]"
        />
      </div>
      {open && products.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-[#DBDFE9] rounded-lg shadow-lg w-80 max-h-52 overflow-y-auto">
          {products.map((p: any) => {
            const stock = getStock(p);
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => {
                  onSelect({
                    id: p.id,
                    name: p.name,
                    purchasePrice: Number(p.purchasePrice ?? 0),
                    currentStock: Number(stock),
                  });
                  setQuery(p.name);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm border-b border-gray-50 last:border-0"
              >
                <div className="font-medium text-[#26272F]">{p.name}</div>
                <div className="flex items-center justify-between text-xs mt-0.5">
                  <span className="text-gray-400 font-mono">{p.sku ?? ''}</span>
                  <span className="text-[#ff6d29] font-semibold">
                    Cost: ৳{Number(p.purchasePrice ?? 0).toLocaleString()}
                  </span>
                  <span className={`font-semibold ${
                    Number(stock) <= 0 ? 'text-red-500' :
                    Number(stock) <= 5 ? 'text-yellow-600' : 'text-gray-500'
                  }`}>
                    Stk: {Number(stock).toFixed(0)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const EMPTY_ITEM = (): PurchaseItem => ({
  _id: Date.now() + Math.random(),
  productId: '',
  productName: '',
  qty: 1,
  unitCost: 0,
  discountAmount: 0,
  total: 0,
  currentStock: -1,
});

const AddPurchase = () => {
  const navigate = useNavigate();
  const { warehouseId: activeWarehouseId, warehouses, hasWarehouses } = useActiveWarehouse();
  const [createPurchase, { isLoading: isSaving }] = useCreatePurchaseMutation();

  // Supplier search
  const [supplierSearch, setSupplierSearch] = useState('');
  const debouncedSupplier = useDebounce(supplierSearch, 300);
  const { data: suppliersData } = useGetAllSuppliersQuery({ search: debouncedSupplier, limit: 50 });
  const suppliers: any[] = suppliersData?.data ?? [];
  const [supplierOpen, setSupplierOpen] = useState(false);
  const supplierRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    supplierId: '',
    supplierName: '',
    warehouseId: activeWarehouseId ?? '',
    invoiceNo: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    discountAmount: '',
    taxAmount: '',
    shippingCost: '',
    paidAmount: '',
    paymentMethod: 'cash',
    note: '',
  });

  const [items, setItems] = useState<PurchaseItem[]>([EMPTY_ITEM()]);

  // Sync warehouse from global selector
  useEffect(() => {
    if (activeWarehouseId) setForm((f) => ({ ...f, warehouseId: activeWarehouseId }));
  }, [activeWarehouseId]);

  // Close supplier dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (supplierRef.current && !supplierRef.current.contains(e.target as Node))
        setSupplierOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Item helpers ────────────────────────────────────────────────────────────

  const calcTotal = (qty: number, cost: number, disc: number) =>
    Math.max(0, qty * cost - disc);

  const updateItem = (_id: number, patch: Partial<PurchaseItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it._id !== _id) return it;
        const updated = { ...it, ...patch };
        updated.total = calcTotal(updated.qty, updated.unitCost, updated.discountAmount);
        return updated;
      }),
    );
  };

  const selectProduct = (_id: number, p: { id: string; name: string; purchasePrice: number; currentStock: number }) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it._id !== _id) return it;
        const updated = { ...it, productId: p.id, productName: p.name, unitCost: p.purchasePrice, currentStock: p.currentStock };
        updated.total = calcTotal(updated.qty, updated.unitCost, updated.discountAmount);
        return updated;
      }),
    );
  };

  const addRow = () => setItems((prev) => [...prev, EMPTY_ITEM()]);
  const removeRow = (_id: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((it) => it._id !== _id));
  };

  // ─── Totals ──────────────────────────────────────────────────────────────────

  const itemsSubtotal = items.reduce((s, i) => s + i.total, 0);
  const extraDiscount = Number(form.discountAmount) || 0;
  const tax = Number(form.taxAmount) || 0;
  const shipping = Number(form.shippingCost) || 0;
  const grandTotal = itemsSubtotal - extraDiscount + tax + shipping;
  const paid = Number(form.paidAmount) || 0;
  const due = Math.max(0, grandTotal - paid);

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.warehouseId) { toast.error('Select a warehouse'); return; }
    if (items.some((i) => !i.productId)) { toast.error('Select a product for every row'); return; }
    if (items.some((i) => i.qty <= 0)) { toast.error('Quantity must be greater than 0'); return; }
    if (items.some((i) => i.unitCost <= 0)) { toast.error('Unit cost must be greater than 0'); return; }

    const payload = {
      supplierId: form.supplierId || undefined,
      warehouseId: form.warehouseId,
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
      paidAmount: paid || undefined,
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

  // ─── Render ──────────────────────────────────────────────────────────────────

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
          <Link
            to="/admin/purchase/list"
            className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
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

              {/* Supplier searchable dropdown */}
              <div ref={supplierRef} className="relative sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Supplier</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search supplier… (optional)"
                    value={form.supplierId ? form.supplierName : supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setForm((f) => ({ ...f, supplierId: '', supplierName: '' }));
                      setSupplierOpen(true);
                    }}
                    onFocus={() => setSupplierOpen(true)}
                    className="w-full pl-9 pr-9 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                  />
                  {form.supplierId && (
                    <button
                      type="button"
                      onClick={() => { setForm((f) => ({ ...f, supplierId: '', supplierName: '' })); setSupplierSearch(''); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >✕</button>
                  )}
                  {!form.supplierId && <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />}
                </div>
                {supplierOpen && suppliers.length > 0 && !form.supplierId && (
                  <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-[#DBDFE9] rounded-lg shadow-lg w-full max-h-48 overflow-y-auto">
                    {suppliers.map((s: any) => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={() => {
                          setForm((f) => ({ ...f, supplierId: s.id, supplierName: s.name }));
                          setSupplierSearch('');
                          setSupplierOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-orange-50 text-sm border-b border-gray-50 last:border-0"
                      >
                        <div className="font-medium text-[#26272F]">{s.name}</div>
                        {s.company && <div className="text-xs text-gray-400">{s.company}</div>}
                        {Number(s.currentBalance) > 0 && (
                          <div className="text-xs text-red-500">Due: ৳{Number(s.currentBalance).toLocaleString()}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Warehouse */}
              {hasWarehouses && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Warehouse <span className="text-red-500">*</span></label>
                  {warehouses.length === 1 ? (
                    <div className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm text-gray-600 bg-gray-50">{warehouses[0].name}</div>
                  ) : (
                    <select
                      value={form.warehouseId}
                      onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                      className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map((w: any) => (
                        <option key={w.id} value={w.id}>{w.name}{w.isDefault ? ' ★' : ''}</option>
                      ))}
                    </select>
                  )}
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
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Purchase Date <span className="text-red-500">*</span></label>
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
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1.5 text-xs text-[#ff6d29] hover:text-[#e65a1f] font-medium"
              >
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
                        {/* Current stock badge — informational for purchases */}
                        {item.productId && item.currentStock >= 0 && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                              item.currentStock === 0 ? 'text-red-500' :
                              item.currentStock <= 5  ? 'text-yellow-600' : 'text-gray-500'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {item.currentStock === 0
                                ? 'Currently out of stock'
                                : `Current stock: ${item.currentStock}`}
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
                          <p className="text-xs mt-0.5 text-center text-gray-400">
                            → {item.currentStock + item.qty}
                          </p>
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
                        <button
                          type="button"
                          onClick={() => removeRow(item._id)}
                          disabled={items.length === 1}
                          className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30"
                        >
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
        <div className="space-y-4">
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 sticky top-4">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Order Summary</h3>

            <div className="space-y-2.5 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span>৳{itemsSubtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Discount (৳)</span>
                <input
                  type="number"
                  min="0"
                  value={form.discountAmount}
                  onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                  placeholder="0"
                  className="w-24 px-2 py-1 text-right border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]"
                />
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Tax (৳)</span>
                <input
                  type="number"
                  min="0"
                  value={form.taxAmount}
                  onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
                  placeholder="0"
                  className="w-24 px-2 py-1 text-right border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]"
                />
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Shipping (৳)</span>
                <input
                  type="number"
                  min="0"
                  value={form.shippingCost}
                  onChange={(e) => setForm({ ...form, shippingCost: e.target.value })}
                  placeholder="0"
                  className="w-24 px-2 py-1 text-right border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]"
                />
              </div>

              <div className="border-t border-[#DBDFE9] pt-2 flex justify-between font-bold text-[#26272F] text-base">
                <span>Grand Total</span>
                <span>৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-3 border-t border-[#DBDFE9] pt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="credit">Credit (Due)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Paid Amount (৳)</label>
                <input
                  type="number"
                  value={form.paidAmount}
                  min="0"
                  onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                  placeholder={`৳${grandTotal.toLocaleString()}`}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>

              {due > 0 && (
                <div className="flex justify-between text-sm font-semibold text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  <span>Due Amount</span>
                  <span>৳{due.toLocaleString()}</span>
                </div>
              )}

              {paid > 0 && due === 0 && (
                <div className="flex justify-between text-sm font-semibold text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <span>Fully Paid</span>
                  <span>৳{paid.toLocaleString()}</span>
                </div>
              )}
            </div>

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
