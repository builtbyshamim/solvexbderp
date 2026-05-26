import { useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Printer } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface SaleItem {
  id: number;
  product: string;
  qty: number;
  unit_price: number;
  discount: number;
  total: number;
}

const AddSale = () => {
  const [items, setItems] = useState<SaleItem[]>([
    { id: 1, product: '', qty: 1, unit_price: 0, discount: 0, total: 0 },
  ]);
  const [form, setForm] = useState({
    customer: '',
    warehouse: 'Main Warehouse',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    paid_amount: '',
    note: '',
    discount: '0',
  });

  const updateItem = (id: number, field: keyof SaleItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const gross = updated.qty * updated.unit_price;
        updated.total = gross - (gross * updated.discount) / 100;
        return updated;
      }),
    );
  };

  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const itemsDiscount = items.reduce((s, i) => s + i.qty * i.unit_price * i.discount / 100, 0);
  const extraDiscount = (subtotal * Number(form.discount)) / 100;
  const grandTotal = subtotal - itemsDiscount - extraDiscount;

  const handleSubmit = () => {
    if (items.some((i) => !i.product.trim())) { toast.error('Please fill all product details'); return; }
    toast.success('Sale saved successfully!');
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
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Sale Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Customer</label>
                <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="">Walk-in Customer</option>
                  <option>Abdullah Al Mamun</option>
                  <option>Fatema Begum</option>
                  <option>Karim Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Warehouse</label>
                <select value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option>Main Warehouse</option>
                  <option>Branch Store</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Sale Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Extra Discount %</label>
                <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} min="0" max="100" placeholder="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#26272F]">Sale Items</h3>
              <button onClick={() => setItems((prev) => [...prev, { id: Date.now(), product: '', qty: 1, unit_price: 0, discount: 0, total: 0 }])}
                className="flex items-center gap-1.5 text-xs text-[#ff6d29] hover:text-[#e65a1f] font-medium">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DBDFE9]">
                    {['Product', 'Qty', 'Unit Price', 'Disc%', 'Total', ''].map((h) => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-2 pr-3">
                        <input type="text" value={item.product} onChange={(e) => updateItem(item.id, 'product', e.target.value)} placeholder="Product name"
                          className="w-full px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29] min-w-[150px]" />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))} min="1"
                          className="w-16 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm text-center focus:outline-none focus:border-[#ff6d29]" />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.unit_price} onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))} min="0"
                          className="w-24 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]" />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.discount} onChange={(e) => updateItem(item.id, 'discount', Number(e.target.value))} min="0" max="100"
                          className="w-14 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm text-center focus:outline-none focus:border-[#ff6d29]" />
                      </td>
                      <td className="py-2 pr-3 font-semibold text-[#26272F] whitespace-nowrap">৳{item.total.toLocaleString()}</td>
                      <td className="py-2">
                        <button onClick={() => items.length > 1 && setItems((prev) => prev.filter((i) => i.id !== item.id))} className="p-1 text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 sticky top-4">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Invoice Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
              {itemsDiscount > 0 && <div className="flex justify-between text-red-500"><span>Item Discount</span><span>-৳{itemsDiscount.toLocaleString()}</span></div>}
              {extraDiscount > 0 && <div className="flex justify-between text-red-500"><span>Extra Discount</span><span>-৳{extraDiscount.toLocaleString()}</span></div>}
              <div className="border-t border-[#DBDFE9] my-2" />
              <div className="flex justify-between font-bold text-[#26272F] text-base"><span>Grand Total</span><span>৳{grandTotal.toLocaleString()}</span></div>
            </div>
            <div className="mt-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="credit">Credit (Due)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Paid Amount</label>
                <input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} placeholder={`৳${grandTotal.toLocaleString()}`} min="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              {form.paid_amount && Number(form.paid_amount) < grandTotal && (
                <div className="flex justify-between text-sm text-red-500 font-medium">
                  <span>Due Amount</span>
                  <span>৳{(grandTotal - Number(form.paid_amount)).toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="space-y-2 mt-5">
              <button onClick={handleSubmit} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
                <Save className="h-4 w-4" /> Save & Print
              </button>
              <button onClick={handleSubmit} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                <Printer className="h-4 w-4" /> Save Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSale;
