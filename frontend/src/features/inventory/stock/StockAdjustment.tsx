import { useState } from 'react';
import { Plus, Search, TrendingUp, TrendingDown } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import toast from 'react-hot-toast';

interface Adjustment {
  id: number;
  date: string;
  product: string;
  sku: string;
  warehouse: string;
  type: 'addition' | 'deduction';
  quantity: number;
  reason: string;
  reference: string;
}

const initialData: Adjustment[] = [
  { id: 1, date: '2025-05-20', product: 'Laptop Stand', sku: 'SKU-001', warehouse: 'Main Warehouse', type: 'addition', quantity: 10, reason: 'Stock received', reference: 'ADJ-001' },
  { id: 2, date: '2025-05-21', product: 'USB-C Cable', sku: 'SKU-002', warehouse: 'Main Warehouse', type: 'deduction', quantity: 5, reason: 'Damaged goods', reference: 'ADJ-002' },
  { id: 3, date: '2025-05-22', product: 'Wireless Mouse', sku: 'SKU-003', warehouse: 'Branch Store', type: 'addition', quantity: 20, reason: 'Opening stock correction', reference: 'ADJ-003' },
];

const StockAdjustment = () => {
  const [adjustments, setAdjustments] = useState<Adjustment[]>(initialData);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ product: '', sku: '', warehouse: 'Main Warehouse', type: 'addition', quantity: '', reason: '' });

  const filtered = adjustments.filter(
    (a) =>
      a.product.toLowerCase().includes(search.toLowerCase()) ||
      a.reference.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = () => {
    if (!form.product.trim() || !form.quantity) { toast.error('Product and quantity are required'); return; }
    const newAdj: Adjustment = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      product: form.product,
      sku: form.sku,
      warehouse: form.warehouse,
      type: form.type as 'addition' | 'deduction',
      quantity: Number(form.quantity),
      reason: form.reason,
      reference: `ADJ-${String(adjustments.length + 1).padStart(3, '0')}`,
    };
    setAdjustments((prev) => [newAdj, ...prev]);
    toast.success('Stock adjustment saved');
    setShowModal(false);
    setForm({ product: '', sku: '', warehouse: 'Main Warehouse', type: 'addition', quantity: '', reason: '' });
  };

  const totalAdditions = adjustments.filter((a) => a.type === 'addition').reduce((s, a) => s + a.quantity, 0);
  const totalDeductions = adjustments.filter((a) => a.type === 'deduction').reduce((s, a) => s + a.quantity, 0);

  return (
    <div>
      <PageHeader
        title="Stock Adjustment"
        subtitle="Add or remove stock quantities with reason"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Inventory', path: '/admin/inventory/products' },
          { label: 'Stock Adjustment' },
        ]}
        actions={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> New Adjustment
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-green-600 font-medium">Total Additions</p>
            <p className="text-xl font-bold text-green-700">+{totalAdditions}</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-red-500 font-medium">Total Deductions</p>
            <p className="text-xl font-bold text-red-600">-{totalDeductions}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search product or reference..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Reference', 'Date', 'Product', 'Warehouse', 'Type', 'Qty', 'Reason'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No adjustments found</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.reference}</td>
                    <td className="px-4 py-3 text-gray-600">{item.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#26272F]">{item.product}</div>
                      <div className="text-xs text-gray-400">{item.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.warehouse}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${item.type === 'addition' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {item.type === 'addition' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {item.type === 'addition' ? 'Addition' : 'Deduction'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={item.type === 'addition' ? 'text-green-600' : 'text-red-500'}>
                        {item.type === 'addition' ? '+' : '-'}{item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">New Stock Adjustment</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="Search product..."
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                    <option value="addition">Addition (+)</option>
                    <option value="deduction">Deduction (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" placeholder="0"
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                <select value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option>Main Warehouse</option>
                  <option>Branch Store</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} placeholder="Reason for adjustment..."
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">Save Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdjustment;
