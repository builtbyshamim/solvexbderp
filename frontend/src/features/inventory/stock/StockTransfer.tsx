import { useState } from 'react';
import { Plus, Search, ArrowRightLeft, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import toast from 'react-hot-toast';

interface Transfer {
  id: number;
  reference: string;
  date: string;
  product: string;
  sku: string;
  from_warehouse: string;
  to_warehouse: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  note: string;
}

const initialData: Transfer[] = [
  { id: 1, reference: 'TRF-001', date: '2025-05-20', product: 'Laptop Stand', sku: 'SKU-001', from_warehouse: 'Main Warehouse', to_warehouse: 'Branch Store', quantity: 5, status: 'completed', note: '' },
  { id: 2, reference: 'TRF-002', date: '2025-05-22', product: 'USB-C Cable', sku: 'SKU-002', from_warehouse: 'Branch Store', to_warehouse: 'Main Warehouse', quantity: 10, status: 'pending', note: 'Urgent transfer' },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
};

const StockTransfer = () => {
  const [transfers, setTransfers] = useState<Transfer[]>(initialData);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ product: '', sku: '', from_warehouse: 'Main Warehouse', to_warehouse: 'Branch Store', quantity: '', note: '' });

  const updateStatus = (id: number, status: Transfer['status']) => {
    setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    toast.success(`Transfer ${status}`);
  };

  const filtered = transfers.filter(
    (t) =>
      t.product.toLowerCase().includes(search.toLowerCase()) ||
      t.reference.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = () => {
    if (!form.product.trim() || !form.quantity) { toast.error('Product and quantity are required'); return; }
    if (form.from_warehouse === form.to_warehouse) { toast.error('Source and destination must be different'); return; }
    const newTransfer: Transfer = {
      id: Date.now(),
      reference: `TRF-${String(transfers.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      product: form.product,
      sku: form.sku,
      from_warehouse: form.from_warehouse,
      to_warehouse: form.to_warehouse,
      quantity: Number(form.quantity),
      status: 'pending',
      note: form.note,
    };
    setTransfers((prev) => [newTransfer, ...prev]);
    toast.success('Stock transfer created');
    setShowModal(false);
    setForm({ product: '', sku: '', from_warehouse: 'Main Warehouse', to_warehouse: 'Branch Store', quantity: '', note: '' });
  };

  return (
    <div>
      <PageHeader
        title="Stock Transfer"
        subtitle="Transfer stock between warehouses"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Inventory', path: '/admin/inventory/products' },
          { label: 'Stock Transfer' },
        ]}
        actions={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> New Transfer
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search product or reference..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} transfers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Reference', 'Date', 'Product', 'From → To', 'Qty', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <ArrowRightLeft className="h-10 w-10 mx-auto mb-2 text-gray-300" />No transfers found
                </td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.reference}</td>
                    <td className="px-4 py-3 text-gray-600">{item.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#26272F]">{item.product}</div>
                      <div className="text-xs text-gray-400">{item.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span>{item.from_warehouse}</span>
                        <ArrowRightLeft className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span>{item.to_warehouse}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#26272F]">{item.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateStatus(item.id, 'completed')} className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors">
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </button>
                          <button onClick={() => updateStatus(item.id, 'cancelled')} className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">
                            <XCircle className="h-3 w-3" /> Cancel
                          </button>
                        </div>
                      )}
                    </td>
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
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">New Stock Transfer</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="Search product..."
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse</label>
                  <select value={form.from_warehouse} onChange={(e) => setForm({ ...form, from_warehouse: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                    <option>Main Warehouse</option>
                    <option>Branch Store</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse</label>
                  <select value={form.to_warehouse} onChange={(e) => setForm({ ...form, to_warehouse: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                    <option>Main Warehouse</option>
                    <option>Branch Store</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" placeholder="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} placeholder="Optional note..."
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">Create Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransfer;
