import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Save, ArrowLeft, Search, Loader2, Percent, BadgeDollarSign, Truck } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetSaleQuery, useUpdateSaleMutation, useGetAllCustomersQuery } from './salesApi';
import { useGetAllProductsQuery } from '../inventory/products/productApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleItem {
  id: number;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  discountType: 'flat' | 'percent';
  discountValue: number;
  discountAmount: number;
  total: number;
  maxStock: number;
}

// ─── Product Search ───────────────────────────────────────────────────────────

const ProductSearch = ({
  productName,
  warehouseId,
  onSelect,
}: {
  productName: string;
  warehouseId: string;
  onSelect: (p: { id: string; name: string; sellingPrice: number; stock: number }) => void;
}) => {
  const [query, setQuery] = useState(productName);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: productsData } = useGetAllProductsQuery({ search: query, limit: 10 }, { skip: query.length < 1 });
  const products: any[] = productsData?.data ?? [];

  useEffect(() => { setQuery(productName); }, [productName]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getStock = (p: any) => {
    const stocks: any[] = p.stocks ?? [];
    if (!stocks.length) return 9999;
    if (warehouseId) {
      const wh = stocks.find((s: any) => s.warehouseId === warehouseId);
      if (wh) return Number(wh.currentQty ?? 0);
    }
    const def = stocks.find((s: any) => s.warehouseId === null);
    if (def) return Number(def.currentQty ?? 0);
    return stocks.reduce((sum: number, s: any) => sum + Number(s.currentQty ?? 0), 0);
  };

  const updatePos = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropdownStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: 288, zIndex: 9999 });
    }
  };

  const dropdown = open && products.length > 0
    ? createPortal(
        <div style={dropdownStyle} className="bg-white border border-[#DBDFE9] rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {products.map((p: any) => {
            const stock = getStock(p);
            return (
              <button key={p.id} onMouseDown={() => {
                onSelect({ id: p.id, name: p.name, sellingPrice: Number(p.sellingPrice), stock });
                setQuery(p.name);
                setOpen(false);
              }}
                className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm border-b border-gray-50 last:border-0"
              >
                <div className="font-medium text-[#26272F]">{p.name}</div>
                <div className="flex items-center justify-between text-xs mt-0.5">
                  <span className="text-gray-400">{p.sku || '—'}</span>
                  <span className="text-[#ff6d29] font-semibold">৳{Number(p.sellingPrice).toLocaleString()}</span>
                  <span className={`font-semibold ${stock <= 0 ? 'text-red-500' : stock <= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {stock <= 0 ? '✕ Out' : `● ${stock} in stock`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          ref={inputRef} type="text" value={query} placeholder="Search product…"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); updatePos(); }}
          onFocus={() => { setOpen(true); updatePos(); }}
          className="w-full pl-7 pr-3 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29] min-w-[150px]"
        />
      </div>
      {dropdown}
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inp = 'px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]';

const computeItemDiscount = (item: SaleItem): number => {
  if (item.discountType === 'percent') {
    return Math.round(item.qty * item.unitPrice * (item.discountValue / 100) * 100) / 100;
  }
  return item.discountValue;
};

const fmtN = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Main Component ───────────────────────────────────────────────────────────

const EditSale = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: saleData, isLoading: saleLoading } = useGetSaleQuery(id!, { skip: !id });
  const [updateSale, { isLoading }] = useUpdateSaleMutation();

  const { data: customersData } = useGetAllCustomersQuery({ limit: 500 });
  const customers: any[] = customersData?.data ?? [];

  const sale = saleData?.data ?? saleData;

  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    discountType: 'flat' as 'flat' | 'percent',
    discountValue: '',
    vatPercent: '',
    deliveryCharge: '',
    note: '',
  });
  const [items, setItems] = useState<SaleItem[]>([
    { id: 1, productId: '', productName: '', qty: 1, unitPrice: 0, discountType: 'flat', discountValue: 0, discountAmount: 0, total: 0, maxStock: 9999 },
  ]);

  // Pre-populate from existing sale
  useEffect(() => {
    if (!sale || initialized) return;
    setInitialized(true);

    const saleItems: any[] = sale.items ?? sale.saleItems ?? [];

    setForm({
      customerId: sale.customerId ?? '',
      date: sale.saleDate ? new Date(sale.saleDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      discountType: 'flat',
      discountValue: Number(sale.discountAmount) > 0 ? String(sale.discountAmount) : '',
      vatPercent: Number(sale.taxAmount) > 0
        ? String(Math.round((Number(sale.taxAmount) / Math.max(Number(sale.subtotal) - Number(sale.discountAmount), 0.01)) * 100 * 100) / 100)
        : '',
      deliveryCharge: Number(sale.deliveryCharge) > 0 ? String(sale.deliveryCharge) : '',
      note: sale.note ?? '',
    });

    if (saleItems.length > 0) {
      setItems(saleItems.map((si: any, idx: number) => ({
        id: idx + 1,
        productId: si.productId ?? '',
        productName: si.product?.name ?? si.productName ?? '',
        qty: Number(si.quantity ?? si.qty ?? 1),
        unitPrice: Number(si.unitPrice ?? 0),
        discountType: 'flat' as const,
        discountValue: Number(si.discountAmount ?? 0),
        discountAmount: Number(si.discountAmount ?? 0),
        total: Number(si.total ?? 0),
        maxStock: 9999,
      })));
    }
  }, [sale, initialized]);

  // ── item helpers ──
  const updateItem = (id: number, patch: Partial<SaleItem>) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, ...patch };
      updated.discountAmount = computeItemDiscount(updated);
      updated.total = Math.max(0, updated.qty * updated.unitPrice - updated.discountAmount);
      return updated;
    }));
  };

  const addRow = () => setItems((prev) => [...prev, {
    id: Date.now(), productId: '', productName: '', qty: 1, unitPrice: 0,
    discountType: 'flat', discountValue: 0, discountAmount: 0, total: 0, maxStock: 9999,
  }]);

  const removeRow = (id: number) => { if (items.length > 1) setItems((prev) => prev.filter((i) => i.id !== id)); };

  // ── calculations ──
  const itemsSubtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const itemsDiscount = items.reduce((s, i) => s + i.discountAmount, 0);
  const afterItemDisc = itemsSubtotal - itemsDiscount;

  const orderDiscValue = Number(form.discountValue) || 0;
  const orderDiscount = form.discountType === 'percent'
    ? Math.round(afterItemDisc * (orderDiscValue / 100) * 100) / 100
    : orderDiscValue;

  const afterOrderDisc = Math.max(0, afterItemDisc - orderDiscount);
  const vatPercent = Number(form.vatPercent) || 0;
  const vatAmount = Math.round(afterOrderDisc * (vatPercent / 100) * 100) / 100;
  const deliveryCharge = Number(form.deliveryCharge) || 0;
  const grandTotal = afterOrderDisc + vatAmount + deliveryCharge;

  const existingPaid = Number(sale?.paidAmount ?? 0);
  const newDue = Math.max(0, grandTotal - existingPaid);

  // ── submit ──
  const handleSubmit = async () => {
    const invalidItems = items.filter((i) => !i.productId || i.qty <= 0);
    if (invalidItems.length > 0) { toast.error('Please fill all product rows with valid quantities'); return; }

    try {
      await updateSale({
        id: id!,
        data: {
          customerId: form.customerId || undefined,
          saleDate: form.date,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.qty,
            unitPrice: i.unitPrice,
            discountAmount: i.discountAmount,
          })),
          discountAmount: orderDiscount || undefined,
          taxAmount: vatAmount || undefined,
          deliveryCharge: deliveryCharge || undefined,
          note: form.note || undefined,
        },
      }).unwrap();
      toast.success('Sale updated successfully!');
      navigate(`/admin/sales/${id}`);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to update sale');
    }
  };

  if (saleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6d29]" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Sale not found.</p>
        <Link to="/admin/sales/list" className="text-[#ff6d29] text-sm mt-2 inline-block">← Back</Link>
      </div>
    );
  }

  if (sale.status === 'cancelled') {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-red-500 font-medium">Cannot edit a cancelled sale.</p>
        <Link to={`/admin/sales/${id}`} className="text-[#ff6d29] text-sm mt-2 inline-block">← Back to invoice</Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit Invoice ${sale.invoiceNo}`}
        subtitle="Modify items, quantities, and charges — payments already collected stay unchanged"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Sales', path: '/admin/sales/list' },
          { label: sale.invoiceNo, path: `/admin/sales/${id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Link to={`/admin/sales/${id}`}
            className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Cancel
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Sale Info */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Sale Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Customer</label>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Sale Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#26272F]">Products</h3>
              <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-[#ff6d29] hover:text-[#e65a1f] font-medium">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DBDFE9]">
                    <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3 min-w-[150px]">Product</th>
                    <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3">Qty</th>
                    <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3">Unit Price ৳</th>
                    <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3 min-w-[130px]">Discount</th>
                    <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3">Total</th>
                    <th className="pb-2 w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-2 pr-3">
                        <ProductSearch
                          productName={item.productName}
                          warehouseId={sale.warehouseId ?? ''}
                          onSelect={(p) => updateItem(item.id, { productId: p.id, productName: p.name, unitPrice: p.sellingPrice, maxStock: p.stock })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.qty} min="1"
                          onChange={(e) => updateItem(item.id, { qty: Math.max(1, Number(e.target.value)) })}
                          className={`${inp} w-16 text-center`}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.unitPrice} min="0" step="0.01"
                          onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                          className={`${inp} w-24`}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1">
                          <button type="button"
                            onClick={() => updateItem(item.id, { discountType: item.discountType === 'flat' ? 'percent' : 'flat', discountValue: 0 })}
                            className={`flex items-center justify-center w-7 h-[30px] rounded border text-xs font-bold transition-colors ${item.discountType === 'percent' ? 'bg-[#ff6d29] text-white border-[#ff6d29]' : 'bg-gray-50 text-gray-500 border-[#DBDFE9]'}`}
                          >
                            {item.discountType === 'percent' ? '%' : '৳'}
                          </button>
                          <input type="number" min="0" max={item.discountType === 'percent' ? 100 : undefined}
                            value={item.discountValue}
                            onChange={(e) => updateItem(item.id, { discountValue: Number(e.target.value) })}
                            className={`${inp} w-20`}
                          />
                        </div>
                        {item.discountType === 'percent' && item.discountValue > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5 pl-8">-৳{item.discountAmount.toFixed(2)}</p>
                        )}
                      </td>
                      <td className="py-2 pr-3 font-semibold text-[#26272F] whitespace-nowrap">
                        ৳{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2">
                        <button onClick={() => removeRow(item.id)} disabled={items.length === 1}
                          className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charges & Adjustments */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Charges & Adjustments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                  <BadgeDollarSign className="h-3.5 w-3.5 text-green-600" /> Order Discount
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex border border-[#DBDFE9] rounded overflow-hidden text-xs">
                    <button type="button" onClick={() => setForm({ ...form, discountType: 'flat', discountValue: '' })}
                      className={`px-2.5 py-1.5 font-semibold transition-colors ${form.discountType === 'flat' ? 'bg-[#ff6d29] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>৳</button>
                    <button type="button" onClick={() => setForm({ ...form, discountType: 'percent', discountValue: '' })}
                      className={`px-2.5 py-1.5 font-semibold transition-colors ${form.discountType === 'percent' ? 'bg-[#ff6d29] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>%</button>
                  </div>
                  <input type="number" min="0" max={form.discountType === 'percent' ? 100 : undefined}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === 'percent' ? '0%' : '0.00'}
                    className="flex-1 px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                  />
                </div>
                {orderDiscount > 0 && <p className="text-xs text-green-600 mt-1">= -৳{fmtN(orderDiscount)}</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                  <Percent className="h-3.5 w-3.5 text-blue-600" /> VAT / Tax (%)
                </label>
                <div className="relative">
                  <input type="number" min="0" max="100" step="0.01" value={form.vatPercent}
                    onChange={(e) => setForm({ ...form, vatPercent: e.target.value })}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29] pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
                </div>
                {vatAmount > 0 && <p className="text-xs text-blue-600 mt-1">= +৳{fmtN(vatAmount)}</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                  <Truck className="h-3.5 w-3.5 text-orange-500" /> Delivery Charge (৳)
                </label>
                <input type="number" min="0" step="0.01" value={form.deliveryCharge}
                  onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Note (optional)</label>
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Internal note…"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div>
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 sticky top-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#26272F] mb-3">Invoice Summary</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal</span>
                  <span>৳{fmtN(itemsSubtotal)}</span>
                </div>
                {itemsDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Item Discounts</span>
                    <span>-৳{fmtN(itemsDiscount)}</span>
                  </div>
                )}
                {orderDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Order Discount</span>
                    <span>-৳{fmtN(orderDiscount)}</span>
                  </div>
                )}
                {vatAmount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>VAT ({form.vatPercent}%)</span>
                    <span>+৳{fmtN(vatAmount)}</span>
                  </div>
                )}
                {deliveryCharge > 0 && (
                  <div className="flex justify-between text-orange-500">
                    <span>Delivery</span>
                    <span>+৳{fmtN(deliveryCharge)}</span>
                  </div>
                )}
                <div className="border-t border-[#DBDFE9] pt-2 mt-1 flex justify-between font-bold text-[#26272F] text-base">
                  <span>New Grand Total</span>
                  <span>৳{fmtN(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Already paid info */}
            <div className="p-3 bg-gray-50 rounded-lg border border-[#DBDFE9] space-y-1.5 text-sm">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Existing Payments</p>
              <div className="flex justify-between text-green-600 font-medium">
                <span>Already Paid</span>
                <span>৳{fmtN(existingPaid)}</span>
              </div>
              {newDue > 0 ? (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>New Due</span>
                  <span>৳{fmtN(newDue)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-green-600 text-xs font-medium">
                  <span>Fully Covered ✓</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : <><Save className="h-4 w-4" /> Update Sale</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSale;
