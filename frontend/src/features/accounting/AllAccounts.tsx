import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Wallet, Building2, Smartphone } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';

type AccountType = 'cash' | 'bank' | 'mobile_banking';

interface Account {
  id: number;
  name: string;
  type: AccountType;
  opening_balance: number;
  current_balance: number;
  account_number?: string;
  is_default: boolean;
  status: 'active' | 'inactive';
}

const accountIcons: Record<AccountType, React.ReactNode> = {
  cash: <Wallet className="h-4 w-4" />,
  bank: <Building2 className="h-4 w-4" />,
  mobile_banking: <Smartphone className="h-4 w-4" />,
};

const accountColors: Record<AccountType, string> = {
  cash: 'bg-green-100 text-green-700',
  bank: 'bg-blue-100 text-blue-700',
  mobile_banking: 'bg-purple-100 text-purple-700',
};

const initialAccounts: Account[] = [
  { id: 1, name: 'Main Cash', type: 'cash', opening_balance: 50000, current_balance: 78500, account_number: '', is_default: true, status: 'active' },
  { id: 2, name: 'Dutch Bangla Bank', type: 'bank', opening_balance: 200000, current_balance: 345000, account_number: '1234567890', is_default: false, status: 'active' },
  { id: 3, name: 'bKash Business', type: 'mobile_banking', opening_balance: 5000, current_balance: 12500, account_number: '01711-000001', is_default: false, status: 'active' },
];

const AllAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: '', type: 'cash', opening_balance: '', account_number: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = accounts.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditItem(null); setForm({ name: '', type: 'cash', opening_balance: '', account_number: '' }); setShowModal(true); };
  const openEdit = (a: Account) => { setEditItem(a); setForm({ name: a.name, type: a.type, opening_balance: String(a.opening_balance), account_number: a.account_number || '' }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Account name is required'); return; }
    if (editItem) {
      setAccounts((prev) => prev.map((a) => a.id === editItem.id ? { ...a, name: form.name, type: form.type as AccountType, opening_balance: Number(form.opening_balance), account_number: form.account_number } : a));
      toast.success('Account updated');
    } else {
      const bal = Number(form.opening_balance);
      setAccounts((prev) => [...prev, { id: Date.now(), name: form.name, type: form.type as AccountType, opening_balance: bal, current_balance: bal, account_number: form.account_number, is_default: false, status: 'active' }]);
      toast.success('Account created');
    }
    setShowModal(false);
  };

  const totalBalance = accounts.reduce((s, a) => s + a.current_balance, 0);

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Manage cash, bank and mobile banking accounts"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Accounting' }, { label: 'Accounts' }]}
        actions={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> Add Account
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Balance', value: totalBalance, icon: <Wallet className="h-5 w-5" />, color: 'text-green-700 bg-green-50 border-green-200' },
          { label: 'Cash Accounts', value: accounts.filter((a) => a.type === 'cash').reduce((s, a) => s + a.current_balance, 0), icon: <Wallet className="h-5 w-5" />, color: 'text-green-700 bg-green-50 border-green-200' },
          { label: 'Bank Accounts', value: accounts.filter((a) => a.type === 'bank').reduce((s, a) => s + a.current_balance, 0), icon: <Building2 className="h-5 w-5" />, color: 'text-blue-700 bg-blue-50 border-blue-200' },
        ].map((s) => (
          <div key={s.label} className={`border rounded-lg p-4 ${s.color}`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="text-2xl font-bold mt-1">৳{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Account Name', 'Type', 'Account No.', 'Opening Balance', 'Current Balance', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No accounts found</td></tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-[#26272F]">{item.name}</div>
                        {item.is_default && <span className="px-1.5 py-0.5 bg-[#fff3eb] text-[#ff6d29] rounded text-xs">Default</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${accountColors[item.type]}`}>
                        {accountIcons[item.type]} {item.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.account_number || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">৳{item.opening_balance.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-green-600">৳{item.current_balance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                        {!item.is_default && <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>}
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
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">{editItem ? 'Edit Account' : 'Add Account'}</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Cash"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="mobile_banking">Mobile Banking</option>
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Account / Phone Number</label>
                <input type="text" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="Account or phone number"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
                <input type="number" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} placeholder="0" min="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" /></div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">{editItem ? 'Update' : 'Create Account'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="h-6 w-6 text-red-500" /></div>
            <h3 className="text-lg font-semibold mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-500 mb-6">All ledger entries will remain but the account will be removed.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm">Cancel</button>
              <button onClick={() => { setAccounts((prev) => prev.filter((a) => a.id !== deleteId)); setDeleteId(null); toast.success('Account deleted'); }} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAccounts;
