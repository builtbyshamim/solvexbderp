import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Phone } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import toast from 'react-hot-toast';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
  total_purchase: number;
  status: 'active' | 'inactive';
}

const initialCustomers: Customer[] = [
  { id: 1, name: 'Abdullah Al Mamun', phone: '01712-000001', email: 'mamun@email.com', address: 'Dhaka', balance: 5000, total_purchase: 85000, status: 'active' },
  { id: 2, name: 'Fatema Begum', phone: '01812-000002', email: '', address: 'Chittagong', balance: 0, total_purchase: 32000, status: 'active' },
  { id: 3, name: 'Karim Enterprise', phone: '01912-000003', email: 'karim@biz.com', address: 'Sylhet', balance: -2500, total_purchase: 120000, status: 'active' },
];

const AllCustomer = () => {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search),
  );

  const openAdd = () => { setEditItem(null); setForm({ name: '', phone: '', email: '', address: '' }); setShowModal(true); };
  const openEdit = (c: Customer) => { setEditItem(c); setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error('Name and phone required'); return; }
    if (editItem) {
      setCustomers((prev) => prev.map((c) => c.id === editItem.id ? { ...c, ...form } : c));
      toast.success('Customer updated');
    } else {
      setCustomers((prev) => [...prev, { id: Date.now(), ...form, balance: 0, total_purchase: 0, status: 'active' }]);
      toast.success('Customer added');
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => { setCustomers((prev) => prev.filter((c) => c.id !== id)); setDeleteId(null); toast.success('Customer deleted'); };

  const totalReceivable = customers.filter((c) => c.balance > 0).reduce((s, c) => s + c.balance, 0);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer contacts and balances"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Sales', path: '/admin/sales/list' }, { label: 'Customers' }]}
        actions={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Customers</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">{customers.length}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold text-green-600 mt-1">৳{customers.reduce((s, c) => s + c.total_purchase, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Receivable</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">৳{totalReceivable.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search customer..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} customers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Customer', 'Phone', 'Address', 'Total Purchases', 'Balance', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No customers found</td></tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.name}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1.5 text-gray-600 text-xs"><Phone className="h-3 w-3" />{item.phone}</div></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.address}</td>
                    <td className="px-4 py-3 font-medium text-green-600">৳{item.total_purchase.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={item.balance > 0 ? 'text-orange-500' : item.balance < 0 ? 'text-red-500' : 'text-gray-500'}>
                        {item.balance > 0 ? `৳${item.balance.toLocaleString()}` : item.balance < 0 ? `-৳${Math.abs(item.balance).toLocaleString()}` : '৳0'}
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
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">{editItem ? 'Edit Customer' : 'Add Customer'}</h2>
            <div className="space-y-3">
              {[
                { label: 'Customer Name *', key: 'name', placeholder: 'Full name', type: 'text' },
                { label: 'Phone *', key: 'phone', placeholder: '01XXXXXXXXX', type: 'text' },
                { label: 'Email', key: 'email', placeholder: 'email@example.com', type: 'email' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} placeholder="Address"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">{editItem ? 'Update' : 'Add Customer'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="h-6 w-6 text-red-500" /></div>
            <h3 className="text-lg font-semibold mb-2">Delete Customer?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCustomer;
