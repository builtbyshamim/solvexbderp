import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Search, Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCreateSaleMutation } from './salesApi';
import { useGetAllCustomersQuery } from './salesApi';
import { useGetAllWarehouseQuery } from '../inventory/warehouse/warehouseApi';
import { useGetAllProductsQuery } from '../inventory/products/productApi';

interface SaleItem {
  id: number;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  discountAmount: number;
  total: number;
  maxStock: number;
}

const ProductSearch = ({
  value, productName, warehouseId,
  onSelect,
}: {
  value: string; productName: string; warehouseId: string;
  onSelect: (p: { id: string; name: string; sellingPrice: number; stock: number }) => void;
}) => {
  const [query, setQuery] = useState(productName);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: productsData } = useGetAllProductsQuery(
    { search: query, limit: 10 },
    { skip: query.length < 1 },
  );
  const products: any[] = productsData?.data?.data ?? [];

  useEffect(() => { setQuery(productName); }, [productName]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getStock = (p: any) => {
    if (!warehouseId) return p.stocks?.[0]?.currentQty ?? 0;
    return p.stocks?.find((s: any) => s.warehouseId === warehouseId)?.currentQty ?? 0;
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text" value={query} placeholder="Search product..."
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full pl-7 pr-3 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29] min-w-[160px]"
        />
      </div>
      {open && products.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-[#DBDFE9] rounded-lg shadow-lg w-72 max-h-48 overflow-y-auto">
          {products.map((p: any) => {
            const stock = getStock(p);
            return (
              <button
                key={p.id}
                onMouseDown={() => {
                  onSelect({ id: p.id, name: p.name, sellingPrice: Number(p.sellingPrice), stock });
                  setQuery(p.name);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm border-b border-gray-50 last:border-0"
              >
                <div className="font-medium text-[#26272F]">{p.name}</div>
                <div className="flex items-center justify-between text-xs mt-0.5">
                  <span className="text-gray-400">{p.sku}</span>
                  <span className="text-[#ff6d29] font-semibold">৳{Number(p.sellingPrice).toLocaleString()}</span>
                  <span className={stock <= 0 ? 'text-red-500' : 'text-gray-400'}>Stk: {stock}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AddSale = () => {
  const navigate = useNavigate();
  const [createSale, { isLoading }] = useCreateSaleMutation();

  const { data: customersData } = useGetAllCustomersQuery({ limit: 200 });
  const { data: warehousesData } = useGetAllWarehouseQuery({});
  const customers: any[] = customersData?.data?.data ?? [];
  const warehouses: any[] = warehousesData?.data?.data ?? warehousesData?.data ?? [];

  const defaultWarehouse = warehouses.find((w: any) => w.isDefault) ?? warehouses[0];

  const [form, setForm] = useState({
    customerId: '',
    warehouseId: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    paidAmount: '',
    discountAmount: '0',
    note: '',
  });

  const [items, setItems] = useState<SaleItem[]>([
    { id: 1, productId: '', productName: '', qty: 1, unitPrice: 0, discountAmount: 0, total: 0, maxStock: 9999 },
  ]);

  useEffect(() => {
    if (defaultWarehouse && !form.warehouseId) {
      setForm((f) => ({ ...f, warehouseId: defaultWarehouse.id }));
    }
  }, [defaultWarehouse]);

  const updateItem = (id: number, patch: Partial<SaleItem>) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, ...patch };
      updated.total = updated.qty * updated.unitPrice - updated.discountAmount;
      return updated;
    }));
  };

  const selectProduct = (rowId: number, p: { id: string; name: string; sellingPrice: number; stock: number }) => {
    updateItem(rowId, { productId: p.id, productName: p.name, unitPrice: p.sellingPrice, maxStock: p.stock });
  };

  const addRow = () => setItems((prev) => [...prev, {
    id: Date.now(), productId: '', productName: '', qty: 1, unitPrice: 0, discountAmount: 0, total: 0, maxStock: 9999,
  }]);

  const removeRow = (id: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const extraDiscount = Number(form.discountAmount);
  const grandTotal = Math.max(0, subtotal - extraDiscount);
  const paidAmt = Number(form.paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - paidAmt);

  const handleSubmit = async () => {
    if (!form.warehouseId) { toast.error('Please select a warehouse'); return; }
    const invalidItems = items.filter((i) => !i.productId || i.qty <= 0);
    if (invalidItems.length > 0) { toast.error('Please select all products and set valid quantities'); return; }

    try {
      const payload = {
        customerId: form.customerId || undefined,
        warehouseId: form.warehouseId,
        saleDate: form.date,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.qty,
          unitPrice: i.unitPrice,
          discountAmount: i.discountAmount,
        })),
        discountAmount: extraDiscount,
        paidAmount: paidAmt,
        paymentMethod: form.paymentMethod,
        note: form.note || undefined,
      };

      await createSale(payload).unwrap();
      toast.success('Sale created successfully!');
      navigate('/admin/sales/list');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create sale');
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Sale"
        subtitle="Create a new sales invoice"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Sales', path: '/admin/sales/list' }, { label: 'Add Sale' }]}
        actions={
          <Link to="/admin/sales/list" className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Sale Info */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Sale Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Customer</label>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="">Walk-in Customer</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Warehouse <span className="text-red-500">*</span></label>
                <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}{w.isDefault ? ' (Default)' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Sale Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Extra Discount (৳)</label>
                <input type="number" value={form.discountAmount} min="0"
                  onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#26272F]">Sale Items</h3>
              <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-[#ff6d29] hover:text-[#e65a1f] font-medium">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DBDFE9]">
                    {['Product', 'Qty', 'Unit Price (৳)', 'Disc (৳)', 'Total', ''].map((h) => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-2 pr-3">
                        <ProductSearch
                          value={item.productId}
                          productName={item.productName}
                          warehouseId={form.warehouseId}
                          onSelect={(p) => selectProduct(item.id, p)}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.qty} min="1" max={item.maxStock}
                          onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) })}
                          className="w-16 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm text-center focus:outline-none focus:border-[#ff6d29]" />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.unitPrice} min="0"
                          onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                          className="w-28 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]" />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.discountAmount} min="0"
                          onChange={(e) => updateItem(item.id, { discountAmount: Number(e.target.value) })}
                          className="w-20 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]" />
                      </td>
                      <td className="py-2 pr-3 font-semibold text-[#26272F] whitespace-nowrap">৳{item.total.toLocaleString()}</td>
                      <td className="py-2">
                        <button onClick={() => removeRow(item.id)} className="p-1 text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <textarea placeholder="Note (optional)" value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
            </div>
          </div>
        </div>

        {/* Summary Panel */}
        <div>
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 sticky top-4">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Invoice Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
              {extraDiscount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-৳{extraDiscount.toLocaleString()}</span></div>}
              <div className="border-t border-[#DBDFE9] my-2" />
              <div className="flex justify-between font-bold text-[#26272F] text-base"><span>Grand Total</span><span>৳{grandTotal.toLocaleString()}</span></div>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="credit">Credit (Due)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Paid Amount (৳)</label>
                <input type="number" value={form.paidAmount}
                  onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                  placeholder={`৳${grandTotal.toLocaleString()}`} min="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              {dueAmount > 0 && (
                <div className="flex justify-between text-sm text-red-500 font-medium px-1">
                  <span>Due Amount</span>
                  <span>৳{dueAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <button onClick={handleSubmit} disabled={isLoading}
              className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Sale</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSale;
