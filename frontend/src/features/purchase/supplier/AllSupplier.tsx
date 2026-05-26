import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Phone, Mail } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import toast from 'react-hot-toast';

interface Supplier {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
  status: 'active' | 'inactive';
}

const initialSuppliers: Supplier[] = [
  { id: 1, name: 'Rahim Trading', company: 'Rahim Traders Ltd.', phone: '01711-000001', email: 'rahim@supplier.com', address: 'Dhaka, Bangladesh', balance: -15000, status: 'active' },
  { id: 2, name: 'Tech Supplies BD', company: 'Tech Supplies Bangladesh', phone: '01911-000002', email: 'tech@supply.bd', address: 'Chittagong, Bangladesh', balance: 0, status: 'active' },
  { id: 3, name: 'Global Imports', company: 'Global Import House', phone: '01611-000003', email: 'info@globalimports.bd', address: 'Dhaka, Bangladesh', balance: -8500, status: 'active' },
];

const AllSupplier = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', address: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.company.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => { setEditItem(null); setForm({ name: '', company: '', phone: '', email: '', address: '' }); setShowModal(true); };
  const openEdit = (item: Supplier) => { setEditItem(item); setForm({ name: item.name, company: item.company, phone: item.phone, email: item.email, address: item.address }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error('Name and phone are required'); return; }
    if (editItem) {
      setSuppliers((prev) => prev.map((s) => s.id === editItem.id ? { ...s, ...form } : s));
      toast.success('Supplier updated');
    } else {
      setSuppliers((prev) => [...prev, { id: Date.now(), ...form, balance: 0, status: 'active' }]);
      toast.success('Supplier added');
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => { setSuppliers((prev) => prev.filter((s) => s.id !== id)); setDeleteId(null); toast.success('Supplier deleted'); };

  const totalPayable = suppliers.filter((s) => s.balance < 0).reduce((sum, s) => sum + Math.abs(s.balance), 0);

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Manage your supplier contacts and balances"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Purchase', path: '/admin/purchase/list' }, { label: 'Suppliers' }]}
        actions={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Suppliers</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">{suppliers.length}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Active Suppliers</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{suppliers.filter((s) => s.status === 'active').length}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Payable</p>
          <p className="text-2xl font-bold text-red-600 mt-1">৳{totalPayable.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search supplier..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} suppliers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Supplier', 'Contact', 'Address', 'Balance', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No suppliers found</td></tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#26272F]">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.company}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs"><Phone className="h-3 w-3" />{item.phone}</div>
                      {item.email && <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5"><Mail className="h-3 w-3" />{item.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.address}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={item.balance < 0 ? 'text-red-600' : item.balance > 0 ? 'text-green-600' : 'text-gray-500'}>
                        {item.balance < 0 ? `-৳${Math.abs(item.balance).toLocaleString()}` : item.balance > 0 ? `+৳${item.balance.toLocaleString()}` : '৳0'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                      </div>
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
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">{editItem ? 'Edit Supplier' : 'Add Supplier'}</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Supplier name"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} placeholder="Full address"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">{editItem ? 'Update' : 'Add Supplier'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="h-6 w-6 text-red-500" /></div>
            <h3 className="text-lg font-semibold text-[#26272F] mb-2">Delete Supplier?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllSupplier;
