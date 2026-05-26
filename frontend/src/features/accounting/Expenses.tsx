import { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';

interface Expense {
  id: number;
  date: string;
  category: string;
  account: string;
  amount: number;
  reference: string;
  note: string;
}

const initialExpenses: Expense[] = [
  { id: 1, date: '2025-05-21', category: 'Utility', account: 'Main Cash', amount: 2500, reference: 'EXP-001', note: 'Electricity bill May' },
  { id: 2, date: '2025-05-22', category: 'Salary', account: 'Dutch Bangla Bank', amount: 35000, reference: 'EXP-002', note: 'Staff salary May' },
  { id: 3, date: '2025-05-23', category: 'Rent', account: 'Main Cash', amount: 15000, reference: 'EXP-003', note: 'Office rent May' },
  { id: 4, date: '2025-05-24', category: 'Transport', account: 'Main Cash', amount: 800, reference: 'EXP-004', note: 'Delivery charge' },
];

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'Utility', account: 'Main Cash', amount: '', note: '' });

  const filtered = expenses.filter((e) => e.category.toLowerCase().includes(search.toLowerCase()) || e.note.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const handleSave = () => {
    if (!form.amount) { toast.error('Amount is required'); return; }
    setExpenses((prev) => [...prev, {
      id: Date.now(), date: form.date, category: form.category, account: form.account,
      amount: Number(form.amount), reference: `EXP-${String(prev.length + 1).padStart(3, '0')}`, note: form.note,
    }]);
    toast.success('Expense recorded');
    setShowModal(false);
    setForm({ date: new Date().toISOString().split('T')[0], category: 'Utility', account: 'Main Cash', amount: '', note: '' });
  };

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Record and track all business expenses"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Accounting', path: '/admin/accounting/accounts' }, { label: 'Expenses' }]}
        actions={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {['Utility', 'Salary', 'Rent', 'Transport'].map((cat) => {
          const amt = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
          return (
            <div key={cat} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
              <p className="text-xs text-gray-500">{cat}</p>
              <p className="text-xl font-bold text-[#26272F] mt-1">৳{amt.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <span className="text-sm font-semibold text-red-500">Total: ৳{total.toLocaleString()}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Reference', 'Date', 'Category', 'Account', 'Amount', 'Note', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.reference}</td>
                  <td className="px-4 py-3 text-gray-600">{item.date}</td>
                  <td className="px-4 py-3"><span className="px-2.5 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">{item.category}</span></td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{item.account}</td>
                  <td className="px-4 py-3 font-bold text-red-600">৳{item.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{item.note}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setExpenses((prev) => prev.filter((e) => e.id !== item.id)); toast.success('Deleted'); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">Record Expense</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                    {['Utility', 'Salary', 'Rent', 'Transport', 'Marketing', 'Maintenance', 'Other'].map((c) => <option key={c}>{c}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Account <span className="text-red-500">*</span></label>
                <select value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option>Main Cash</option><option>Dutch Bangla Bank</option><option>bKash Business</option>
                </select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Amount <span className="text-red-500">*</span></label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" min="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Description"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" /></div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">Save Expense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
