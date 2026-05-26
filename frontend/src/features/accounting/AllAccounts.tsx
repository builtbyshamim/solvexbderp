import { useState } from 'react';
import { Plus, Pencil, Trash2, Wallet, Building2, Smartphone, Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import {
  useGetAllAccountsQuery,
  useGetAccountSummaryQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} from './accountingApi';

type AccountType = 'cash' | 'bank' | 'mobile_banking' | 'receivable' | 'payable' | 'income' | 'expense' | 'equity';

const accountIcons: Record<string, React.ReactNode> = {
  cash: <Wallet className="h-4 w-4" />,
  bank: <Building2 className="h-4 w-4" />,
  mobile_banking: <Smartphone className="h-4 w-4" />,
};

const accountTypeColors: Record<string, string> = {
  cash: 'bg-green-100 text-green-700',
  bank: 'bg-blue-100 text-blue-700',
  mobile_banking: 'bg-purple-100 text-purple-700',
};

const emptyForm = { name: '', accountType: 'cash', openingBalance: '', description: '', bankName: '', accountNumber: '' };

const AllAccounts = () => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const { data: accounts = [], isLoading } = useGetAllAccountsQuery({});
  const { data: summary } = useGetAccountSummaryQuery(undefined);
  const [createAccount, { isLoading: creating }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: updating }] = useUpdateAccountMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, accountType: item.accountType, openingBalance: '', description: item.description ?? '', bankName: item.bankName ?? '', accountNumber: item.accountNumber ?? '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Account name is required'); return; }
    try {
      if (editItem) {
        await updateAccount({ id: editItem.id, data: { name: form.name, description: form.description, bankName: form.bankName, accountNumber: form.accountNumber } }).unwrap();
        toast.success('Account updated');
      } else {
        await createAccount({ name: form.name, accountType: form.accountType, openingBalance: form.openingBalance ? Number(form.openingBalance) : 0, description: form.description, bankName: form.bankName, accountNumber: form.accountNumber }).unwrap();
        toast.success('Account created');
      }
      setShowModal(false);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to save account');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteAccount(deleteItem.id).unwrap();
      toast.success('Account deleted');
      setDeleteItem(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Cannot delete: account has ledger entries');
    }
  };

  const f = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Manage cash, bank, and mobile banking accounts"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Accounting', path: '/admin/accounting' }, { label: 'Accounts' }]}
        actions={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> Add Account
          </button>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
            <p className="text-xs text-gray-500">Total Assets</p>
            <p className="text-2xl font-bold text-[#26272F] mt-1">৳{Number(summary.summary?.totalAssets ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Cash</p>
            <p className="text-2xl font-bold text-green-700 mt-1">৳{Number(summary.summary?.totalCash ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Bank</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">৳{Number(summary.summary?.totalBank ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Mobile Banking</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">৳{Number(summary.summary?.totalMobileBanking ?? 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <h3 className="font-semibold text-[#26272F]">All Accounts ({accounts.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Account Name', 'Type', 'Account Number', 'Opening Balance', 'Current Balance', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" /></td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No accounts found. Add your first account.</td></tr>
              ) : (
                accounts.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                          {accountIcons[item.accountType] ?? <Wallet className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-[#26272F]">{item.name}</div>
                          {item.bankName && <div className="text-xs text-gray-400">{item.bankName}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${accountTypeColors[item.accountType] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.accountType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.accountNumber || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">৳{Number(item.openingBalance).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-[#26272F]">৳{Number(item.currentBalance).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteItem(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Petty Cash"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              {!editItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select value={form.accountType} onChange={e => f('accountType', e.target.value)}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="mobile_banking">Mobile Banking</option>
                  </select>
                </div>
              )}
              {!editItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
                  <input type="number" min="0" value={form.openingBalance} onChange={e => f('openingBalance', e.target.value)} placeholder="0"
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input value={form.bankName} onChange={e => f('bankName', e.target.value)} placeholder="e.g. Dutch Bangla Bank"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input value={form.accountNumber} onChange={e => f('accountNumber', e.target.value)} placeholder="Account number"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} placeholder="Optional note"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={creating || updating} className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {(creating || updating) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editItem ? 'Update' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="h-6 w-6 text-red-500" /></div>
            <h3 className="text-lg font-semibold mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-500 mb-6">This cannot be undone. Accounts with ledger entries cannot be deleted.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteItem(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60 flex items-center gap-2">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAccounts;
