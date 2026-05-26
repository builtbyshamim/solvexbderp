import { useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface PurchaseItem {
  id: number;
  product: string;
  sku: string;
  qty: number;
  unit_cost: number;
  discount: number;
  tax: number;
  total: number;
}

const AddPurchase = () => {
  const [items, setItems] = useState<PurchaseItem[]>([
    { id: 1, product: '', sku: '', qty: 1, unit_cost: 0, discount: 0, tax: 0, total: 0 },
  ]);
  const [form, setForm] = useState({
    supplier: '',
    warehouse: 'Main Warehouse',
    date: new Date().toISOString().split('T')[0],
    invoice_no: '',
    payment_method: 'cash',
    paid_amount: '',
    note: '',
  });

  const updateItem = (id: number, field: keyof PurchaseItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const cost = updated.qty * updated.unit_cost;
        const discAmt = (cost * updated.discount) / 100;
        const taxAmt = ((cost - discAmt) * updated.tax) / 100;
        updated.total = cost - discAmt + taxAmt;
        return updated;
      }),
    );
  };

  const addRow = () => {
    setItems((prev) => [...prev, { id: Date.now(), product: '', sku: '', qty: 1, unit_cost: 0, discount: 0, tax: 0, total: 0 }]);
  };

  const removeRow = (id: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const grandTotal = subtotal;

  const handleSubmit = () => {
    if (!form.supplier.trim()) { toast.error('Please select a supplier'); return; }
    if (items.some((i) => !i.product.trim())) { toast.error('Please fill all product details'); return; }
    toast.success('Purchase saved successfully!');
  };

  return (
    <div>
      <PageHeader
        title="Add Purchase"
        subtitle="Create a new purchase invoice"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Purchase', path: '/admin/purchase/list' }, { label: 'Add Purchase' }]}
        actions={
          <Link to="/admin/purchase/list" className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Invoice Info */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Purchase Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Supplier <span className="text-red-500">*</span></label>
                <select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="">Select supplier...</option>
                  <option>Rahim Trading</option>
                  <option>Tech Supplies BD</option>
                  <option>Global Imports</option>
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
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Invoice No.</label>
                <input type="text" value={form.invoice_no} onChange={(e) => setForm({ ...form, invoice_no: e.target.value })} placeholder="Supplier invoice number"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Purchase Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#26272F]">Purchase Items</h3>
              <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-[#ff6d29] hover:text-[#e65a1f] font-medium">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DBDFE9]">
                    {['Product', 'Qty', 'Unit Cost', 'Disc%', 'Tax%', 'Total', ''].map((h) => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-2 pr-3">
                        <input type="text" value={item.product} onChange={(e) => updateItem(item.id, 'product', e.target.value)} placeholder="Product name"
                          className="w-full px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29] min-w-[140px]" />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))} min="1"
                          className="w-16 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm text-center focus:outline-none focus:border-[#ff6d29]" />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.unit_cost} onChange={(e) => updateItem(item.id, 'unit_cost', Number(e.target.value))} min="0"
                          className="w-24 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]" />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.discount} onChange={(e) => updateItem(item.id, 'discount', Number(e.target.value))} min="0" max="100"
                          className="w-14 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm text-center focus:outline-none focus:border-[#ff6d29]" />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" value={item.tax} onChange={(e) => updateItem(item.id, 'tax', Number(e.target.value))} min="0" max="100"
                          className="w-14 px-2 py-1.5 border border-[#DBDFE9] rounded text-sm text-center focus:outline-none focus:border-[#ff6d29]" />
                      </td>
                      <td className="py-2 pr-3 font-semibold text-[#26272F] whitespace-nowrap">৳{item.total.toLocaleString()}</td>
                      <td className="py-2">
                        <button onClick={() => removeRow(item.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Note */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Note (Optional)</label>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} placeholder="Add a note..."
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 sticky top-4">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Order Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="border-t border-[#DBDFE9] my-2" />
              <div className="flex justify-between font-bold text-[#26272F] text-base">
                <span>Grand Total</span>
                <span>৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
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

            <button onClick={handleSubmit} className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
              <Save className="h-4 w-4" /> Save Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPurchase;
