import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Search,
  Loader2,
  Percent,
  BadgeDollarSign,
  Truck,
  Tag,
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCreateSaleMutation, useGetAllCustomersQuery } from './salesApi';
import { useGetAllProductsQuery } from '../inventory/products/productApi';
import { useActiveWarehouse } from '../../hooks/useActiveWarehouse';

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

interface PaymentEntry {
  id: number;
  method: string;
  amount: string;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit', label: 'Credit (Due)' },
  { value: 'other', label: 'Other' },
];

// ─── Product Search Dropdown ──────────────────────────────────────────────────

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

  const { data: productsData } = useGetAllProductsQuery(
    { search: query, limit: 10 },
    { skip: query.length < 1 },
  );
  const products: any[] = productsData?.data ?? [];

  useEffect(() => {
    setQuery(productName);
  }, [productName]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: r.bottom + 4,
        left: r.left,
        width: 288,
        zIndex: 9999,
      });
    }
  };

  const getStock = (p: any) => {
    if (!warehouseId) {
      return (p.stocks ?? []).reduce((s: number, st: any) => s + Number(st.currentQty ?? 0), 0);
    }
    return p.stocks?.find((s: any) => s.warehouseId === warehouseId)?.currentQty ?? 0;
  };

  const dropdown =
    open && products.length > 0
      ? createPortal(
          <div
            style={dropdownStyle}
            className="bg-white border border-[#DBDFE9] rounded-lg shadow-lg max-h-52 overflow-y-auto scroll-brand"
          >
            {products.map((p: any) => {
              const stock = getStock(p);
              return (
                <button
                  key={p.id}
                  onMouseDown={() => {
                    onSelect({
                      id: p.id,
                      name: p.name,
                      sellingPrice: Number(p.sellingPrice),
                      stock: Number(stock),
                    });
                    setQuery(p.name);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm border-b border-gray-50 last:border-0"
                >
                  <div className="font-medium text-[#26272F]">{p.name}</div>
                  <div className="flex items-center justify-between text-xs mt-0.5">
                    <span className="text-gray-400">{p.sku || '—'}</span>
                    <span className="text-[#ff6d29] font-semibold">
                      ৳{Number(p.sellingPrice).toLocaleString()}
                    </span>
                    <span
                      className={`font-semibold ${
                        Number(stock) <= 0
                          ? 'text-red-500'
                          : Number(stock) <= 5
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}
                    >
                      {Number(stock) <= 0
                        ? '✕ Out of stock'
                        : `● ${Number(stock).toFixed(0)} in stock`}
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
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search product…"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            updateDropdownPosition();
          }}
          onFocus={() => {
            setOpen(true);
            updateDropdownPosition();
          }}
          className="w-full pl-7 pr-3 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29] min-w-[150px]"
        />
      </div>
      {dropdown}
    </div>
  );
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const inp =
  'px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]';

const computeItemDiscount = (item: SaleItem): number => {
  if (item.discountType === 'percent') {
    return Math.round(item.qty * item.unitPrice * (item.discountValue / 100) * 100) / 100;
  }
  return item.discountValue;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AddSale = () => {
  const navigate = useNavigate();
  const [createSale, { isLoading }] = useCreateSaleMutation();

  const { data: customersData } = useGetAllCustomersQuery({ limit: 500 });
  const customers: any[] = customersData?.data ?? [];
  const { warehouseId: activeWarehouseId, warehouses, hasWarehouses } = useActiveWarehouse();

  // ── form state ──
  const [form, setForm] = useState({
    customerId: '',
    warehouseId: activeWarehouseId ?? '',
    date: new Date().toISOString().split('T')[0],
    invoiceNo: '',
    // order discount
    discountType: 'flat' as 'flat' | 'percent',
    discountValue: '',
    // VAT
    vatPercent: '',
    // delivery
    deliveryCharge: '',
    // offer label
    offerLabel: '',
    note: '',
  });

  useEffect(() => {
    if (activeWarehouseId) setForm((f) => ({ ...f, warehouseId: activeWarehouseId }));
  }, [activeWarehouseId]);

  // ── items ──
  const [items, setItems] = useState<SaleItem[]>([
    {
      id: 1,
      productId: '',
      productName: '',
      qty: 1,
      unitPrice: 0,
      discountType: 'flat',
      discountValue: 0,
      discountAmount: 0,
      total: 0,
      maxStock: 9999,
    },
  ]);

  // ── payments ──
  const [payments, setPayments] = useState<PaymentEntry[]>([{ id: 1, method: 'cash', amount: '' }]);

  // When warehouse changes after products are already added, reset their stock cap
  // so the old maxStock doesn't block; backend re-validates.
  const prevWarehouseRef = useRef(form.warehouseId);
  useEffect(() => {
    if (prevWarehouseRef.current && prevWarehouseRef.current !== form.warehouseId) {
      if (items.some((i) => i.productId)) {
        setItems((prev) => prev.map((i) => ({ ...i, maxStock: 9999 })));
        toast('Warehouse changed — re-select products to refresh stock levels', { icon: '⚠️' });
      }
    }
    prevWarehouseRef.current = form.warehouseId;
  }, [form.warehouseId]);

  // ── item helpers ──
  const updateItem = (id: number, patch: Partial<SaleItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };
        updated.discountAmount = computeItemDiscount(updated);
        updated.total = Math.max(0, updated.qty * updated.unitPrice - updated.discountAmount);
        return updated;
      }),
    );
  };

  const selectProduct = (
    rowId: number,
    p: { id: string; name: string; sellingPrice: number; stock: number },
  ) => {
    updateItem(rowId, {
      productId: p.id,
      productName: p.name,
      unitPrice: p.sellingPrice,
      maxStock: p.stock,
    });
  };

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        productId: '',
        productName: '',
        qty: 1,
        unitPrice: 0,
        discountType: 'flat',
        discountValue: 0,
        discountAmount: 0,
        total: 0,
        maxStock: 9999,
      },
    ]);

  const removeRow = (id: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // ── payment helpers ──
  const addPayment = () =>
    setPayments((prev) => [...prev, { id: Date.now(), method: 'cash', amount: '' }]);

  const updatePayment = (id: number, patch: Partial<PaymentEntry>) =>
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removePayment = (id: number) => {
    if (payments.length === 1) return;
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  // ── calculations ──
  const itemsSubtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const itemsDiscount = items.reduce((s, i) => s + i.discountAmount, 0);
  const afterItemDisc = itemsSubtotal - itemsDiscount;

  const orderDiscValue = Number(form.discountValue) || 0;
  const orderDiscount =
    form.discountType === 'percent'
      ? Math.round(afterItemDisc * (orderDiscValue / 100) * 100) / 100
      : orderDiscValue;

  const afterOrderDisc = Math.max(0, afterItemDisc - orderDiscount);

  const vatPercent = Number(form.vatPercent) || 0;
  const vatAmount = Math.round(afterOrderDisc * (vatPercent / 100) * 100) / 100;

  const deliveryCharge = Number(form.deliveryCharge) || 0;

  const grandTotal = afterOrderDisc + vatAmount + deliveryCharge;

  const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const dueAmount = Math.max(0, grandTotal - totalPaid);

  // Auto-fill last payment row amount to match remaining balance
  const fillRemaining = () => {
    const prevPaid = payments.slice(0, -1).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const remaining = Math.max(0, grandTotal - prevPaid);
    setPayments((prev) =>
      prev.map((p, i) => (i === prev.length - 1 ? { ...p, amount: remaining.toFixed(2) } : p)),
    );
  };

  // ── submit ──
  const handleSubmit = async () => {
    const invalidItems = items.filter((i) => !i.productId || i.qty <= 0);
    if (invalidItems.length > 0) {
      toast.error('Please fill all product rows with valid quantities');
      return;
    }
    if (!form.warehouseId) {
      toast.error('Please select a warehouse');
      return;
    }

    // Stock checks (frontend guard — backend enforces too)
    const outOfStock = items.find((i) => i.productId && i.maxStock === 0 && i.maxStock !== 9999);
    if (outOfStock) {
      toast.error(`"${outOfStock.productName}" is out of stock`);
      return;
    }
    const overStock = items.find((i) => i.productId && i.maxStock < 9999 && i.qty > i.maxStock);
    if (overStock) {
      toast.error(
        `"${overStock.productName}" — only ${overStock.maxStock} units available, you entered ${overStock.qty}`,
      );
      return;
    }
    const validPayments = payments.filter((p) => Number(p.amount) > 0);

    try {
      const payload: any = {
        customerId: form.customerId || undefined,
        warehouseId: form.warehouseId,
        saleDate: form.date,
        invoiceNo: form.invoiceNo || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.qty,
          unitPrice: i.unitPrice,
          discountAmount: i.discountAmount,
        })),
        discountAmount: orderDiscount,
        taxAmount: vatAmount,
        deliveryCharge: deliveryCharge || undefined,
        paidAmount: totalPaid,
        payments:
          validPayments.length > 0
            ? validPayments.map((p) => ({ method: p.method, amount: Number(p.amount) }))
            : undefined,
        paymentMethod: validPayments[0]?.method || 'cash',
        offerLabel: form.offerLabel || undefined,
        note: form.note || undefined,
      };

      const result = await createSale(payload).unwrap();
      const newId = result?.data?.id ?? result?.id;
      toast.success('Sale created successfully!');
      if (newId) {
        navigate(`/admin/sales/${newId}`);
      } else {
        navigate('/admin/sales/list');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to create sale');
    }
  };

  const fmtN = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <PageHeader
        title="Add Sale"
        subtitle="Create a new sales invoice"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Sales', path: '/admin/sales/list' },
          { label: 'Add Sale' },
        ]}
        actions={
          <Link
            to="/admin/sales/list"
            className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
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
                <select
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.phone ? ` — ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {hasWarehouses && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Warehouse {warehouses.length > 1 && <span className="text-red-500">*</span>}
                  </label>
                  {warehouses.length === 1 ? (
                    <div className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm text-gray-600 bg-gray-50">
                      {warehouses[0].name}
                    </div>
                  ) : (
                    <select
                      value={form.warehouseId}
                      onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                      className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                          {w.isDefault ? ' ★' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Sale Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Invoice No <span className="text-gray-400">(optional, auto-generated)</span>
                </label>
                <input
                  type="text"
                  value={form.invoiceNo}
                  onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                  placeholder="e.g. INV-2025-001"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#26272F]">Products</h3>
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 text-xs text-[#ff6d29] hover:text-[#e65a1f] font-medium"
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto scroll-brand">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DBDFE9]">
                    <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3 min-w-[150px]">
                      Product
                    </th>
                    <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3">
                      Qty
                    </th>
                    <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3">
                      Unit Price ৳
                    </th>
                    <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3 min-w-[130px]">
                      Discount
                    </th>
                    <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3">
                      Total
                    </th>
                    <th className="pb-2 w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const stockKnown = item.productId && item.maxStock < 9999;
                    const overLimit = stockKnown && item.qty > item.maxStock;
                    const nearLimit =
                      stockKnown && !overLimit && item.qty >= Math.ceil(item.maxStock * 0.8);
                    const noStock = stockKnown && item.maxStock <= 0;
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-50 ${overLimit || noStock ? 'bg-red-50/30' : ''}`}
                      >
                        <td className="py-2 pr-3">
                          <ProductSearch
                            productName={item.productName}
                            warehouseId={form.warehouseId}
                            onSelect={(p) => selectProduct(item.id, p)}
                          />
                          {/* Stock badge shown after product selected */}
                          {item.productId && (
                            <div className="mt-1 flex items-center gap-1">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium ${
                                  noStock
                                    ? 'text-red-600'
                                    : overLimit
                                      ? 'text-red-600'
                                      : nearLimit
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {noStock
                                  ? 'Out of stock'
                                  : overLimit
                                    ? `Only ${item.maxStock} in stock`
                                    : nearLimit
                                      ? `${item.maxStock} in stock (low)`
                                      : `${item.maxStock} in stock`}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            value={item.qty}
                            min="1"
                            max={stockKnown ? item.maxStock : undefined}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              const clamped = stockKnown ? Math.min(raw, item.maxStock) : raw;
                              updateItem(item.id, { qty: Math.max(1, clamped) });
                            }}
                            className={`${inp} w-16 text-center ${
                              overLimit || noStock
                                ? 'border-red-400 bg-red-50 text-red-700 font-semibold'
                                : nearLimit
                                  ? 'border-yellow-400'
                                  : ''
                            }`}
                          />
                          {stockKnown && item.maxStock > 0 && !overLimit && (
                            <p
                              className={`text-xs mt-0.5 text-center ${nearLimit ? 'text-yellow-600 font-medium' : 'text-gray-400'}`}
                            >
                              {item.maxStock - item.qty === 0
                                ? 'Max!'
                                : `${item.maxStock - item.qty} left`}
                            </p>
                          )}
                          {noStock && (
                            <p className="text-xs mt-0.5 text-center text-red-600 font-medium">
                              No stock
                            </p>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            value={item.unitPrice}
                            min="0"
                            step="0.01"
                            onChange={(e) =>
                              updateItem(item.id, { unitPrice: Number(e.target.value) })
                            }
                            className={`${inp} w-24`}
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-1">
                            {/* Toggle ৳ / % */}
                            <button
                              type="button"
                              onClick={() =>
                                updateItem(item.id, {
                                  discountType: item.discountType === 'flat' ? 'percent' : 'flat',
                                  discountValue: 0,
                                })
                              }
                              className={`flex items-center justify-center w-7 h-[30px] rounded border text-xs font-bold transition-colors ${
                                item.discountType === 'percent'
                                  ? 'bg-[#ff6d29] text-white border-[#ff6d29]'
                                  : 'bg-gray-50 text-gray-500 border-[#DBDFE9] hover:border-[#ff6d29]'
                              }`}
                              title={
                                item.discountType === 'flat'
                                  ? 'Switch to percent'
                                  : 'Switch to flat'
                              }
                            >
                              {item.discountType === 'percent' ? '%' : '৳'}
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={item.discountType === 'percent' ? 100 : undefined}
                              value={item.discountValue}
                              onChange={(e) =>
                                updateItem(item.id, { discountValue: Number(e.target.value) })
                              }
                              className={`${inp} w-20`}
                            />
                          </div>
                          {item.discountType === 'percent' && item.discountValue > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5 pl-8">
                              -৳{item.discountAmount.toFixed(2)}
                            </p>
                          )}
                        </td>
                        <td className="py-2 pr-3 font-semibold text-[#26272F] whitespace-nowrap">
                          ৳
                          {item.total.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => removeRow(item.id)}
                            disabled={items.length === 1}
                            className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charges & Adjustments */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Charges & Adjustments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order Discount */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                  <BadgeDollarSign className="h-3.5 w-3.5 text-green-600" /> Order Discount
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex border border-[#DBDFE9] rounded overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, discountType: 'flat', discountValue: '' })}
                      className={`px-2.5 py-1.5 font-semibold transition-colors ${form.discountType === 'flat' ? 'bg-[#ff6d29] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      ৳
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...form, discountType: 'percent', discountValue: '' })
                      }
                      className={`px-2.5 py-1.5 font-semibold transition-colors ${form.discountType === 'percent' ? 'bg-[#ff6d29] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      %
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={form.discountType === 'percent' ? 100 : undefined}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === 'percent' ? '0%' : '0.00'}
                    className="flex-1 px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                  />
                </div>
                {orderDiscount > 0 && (
                  <p className="text-xs text-green-600 mt-1">= -৳{fmtN(orderDiscount)}</p>
                )}
              </div>

              {/* VAT */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                  <Percent className="h-3.5 w-3.5 text-blue-600" /> VAT / Tax (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.vatPercent}
                    onChange={(e) => setForm({ ...form, vatPercent: e.target.value })}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                    %
                  </span>
                </div>
                {vatAmount > 0 && (
                  <p className="text-xs text-blue-600 mt-1">= +৳{fmtN(vatAmount)}</p>
                )}
              </div>

              {/* Delivery Charge */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                  <Truck className="h-3.5 w-3.5 text-orange-500" /> Delivery Charge (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deliveryCharge}
                  onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>

              {/* Offer / Coupon Label */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                  <Tag className="h-3.5 w-3.5 text-purple-500" /> Offer / Coupon Label
                </label>
                <input
                  type="text"
                  value={form.offerLabel}
                  onChange={(e) => setForm({ ...form, offerLabel: e.target.value })}
                  placeholder="e.g. EID2025, FLAT100"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
            </div>

            {/* Note */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Note <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                placeholder="Internal note…"
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div>
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 sticky top-4 space-y-4">
            {/* Invoice Summary */}
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
                    <span>
                      Order Discount{form.discountType === 'percent' && ` (${form.discountValue}%)`}
                    </span>
                    <span>-৳{fmtN(orderDiscount)}</span>
                  </div>
                )}
                {form.offerLabel && (
                  <div className="flex items-center gap-1 text-purple-600 text-xs py-0.5">
                    <Tag className="h-3 w-3" />
                    <span>{form.offerLabel}</span>
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
                    <span>Delivery Charge</span>
                    <span>+৳{fmtN(deliveryCharge)}</span>
                  </div>
                )}
                <div className="border-t border-[#DBDFE9] pt-2 mt-1 flex justify-between font-bold text-[#26272F] text-base">
                  <span>Grand Total</span>
                  <span>৳{fmtN(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#26272F]">Payment Methods</h3>
                <button
                  onClick={addPayment}
                  className="flex items-center gap-1 text-xs text-[#ff6d29] hover:text-[#e65a1f] font-medium"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>

              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <select
                      value={p.method}
                      onChange={(e) => updatePayment(p.id, { method: e.target.value })}
                      className="flex-1 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29] min-w-0"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <div className="relative w-28 flex-shrink-0">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                        ৳
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={p.amount}
                        onChange={(e) => updatePayment(p.id, { amount: e.target.value })}
                        onFocus={() => {
                          if (!p.amount) fillRemaining();
                        }}
                        placeholder="0.00"
                        className="w-full pl-5 pr-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]"
                      />
                    </div>
                    <button
                      onClick={() => removePayment(p.id)}
                      disabled={payments.length === 1}
                      className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick fill buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    setPayments((prev) =>
                      prev.map((p, i) => (i === 0 ? { ...p, amount: grandTotal.toFixed(2) } : p)),
                    )
                  }
                  className="flex-1 py-1 text-xs border border-[#DBDFE9] rounded hover:bg-gray-50 text-gray-500"
                >
                  Full Amount
                </button>
                <button
                  type="button"
                  onClick={() => setPayments((prev) => prev.map((p) => ({ ...p, amount: '' })))}
                  className="flex-1 py-1 text-xs border border-[#DBDFE9] rounded hover:bg-gray-50 text-gray-500"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-[#DBDFE9] pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-green-600 font-medium">
                <span>Total Paid</span>
                <span>৳{fmtN(totalPaid)}</span>
              </div>
              {dueAmount > 0 ? (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Due Amount</span>
                  <span>৳{fmtN(dueAmount)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-green-600 text-xs">
                  <span>Fully Paid ✓</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Sale
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSale;
