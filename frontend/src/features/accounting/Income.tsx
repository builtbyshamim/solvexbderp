import { useState } from 'react';
import { Search, Plus, Trash2, Loader2, TrendingUp, Settings2, X, Pencil, Check } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import {
  useGetAllAccountsQuery,
  useGetIncomesQuery,
  useRecordIncomeMutation,
  useDeleteTransactionMutation,
  useGetAccountingCategoriesQuery,
  useCreateAccountingCategoryMutation,
  useUpdateAccountingCategoryMutation,
  useDeleteAccountingCategoryMutation,
} from './accountingApi';
import CategorySelect, { CategoryBadge } from './CategorySelect';
import { useLanguage } from '../../context/LanguageContext';

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const emptyForm = {
  transactionDate: new Date().toISOString().split('T')[0],
  category: '',
  accountId: '',
  amount: '',
  note: '',
};

const Income = () => {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [page, setPage] = useState(1);

  // manage panel state
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PALETTE[0]);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  const { data: accountsData = [] } = useGetAllAccountsQuery({});
  const cashAccounts = (accountsData as any[]).filter((a) =>
    ['cash', 'bank', 'mobile_banking'].includes(a.accountType),
  );

  const { data: categories = [] } = useGetAccountingCategoriesQuery({ type: 'income' });

  const { data: incomesRes, isLoading } = useGetIncomesQuery({
    search,
    category: filterCategory || undefined,
    page,
    limit: 20,
  });
  const incomes = incomesRes?.data ?? [];
  const meta = incomesRes?.meta;

  const [recordIncome, { isLoading: saving }] = useRecordIncomeMutation();
  const [deleteTransaction, { isLoading: deleting }] = useDeleteTransactionMutation();
  const [createCategory, { isLoading: creatingCat }] = useCreateAccountingCategoryMutation();
  const [updateCategory, { isLoading: updatingCat }] = useUpdateAccountingCategoryMutation();
  const [deleteCategory, { isLoading: deletingCat }] = useDeleteAccountingCategoryMutation();

  const totalIncome = incomes.reduce((s: number, e: any) => s + Number(e.debit), 0);

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Amount must be greater than 0'); return; }
    if (!form.accountId) { toast.error('Please select an account'); return; }
    try {
      await recordIncome({
        accountId: form.accountId,
        transactionDate: form.transactionDate,
        amount: Number(form.amount),
        category: form.category || undefined,
        note: form.note || undefined,
      }).unwrap();
      toast.success('Income recorded');
      setShowModal(false);
      setForm(emptyForm);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to record income');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteTransaction(deleteItem.id).unwrap();
      toast.success('Income deleted');
      setDeleteItem(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to delete');
    }
  };

  const handleCreateCat = async () => {
    if (!newCatName.trim()) { toast.error('Name required'); return; }
    try {
      await createCategory({ name: newCatName.trim(), type: 'income', color: newCatColor }).unwrap();
      toast.success('Category created');
      setNewCatName('');
      setNewCatColor(PALETTE[0]);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed');
    }
  };

  const handleUpdateCat = async (id: string) => {
    try {
      await updateCategory({ id, data: { name: editCatName, color: editCatColor } }).unwrap();
      toast.success('Updated');
      setEditCatId(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed');
    }
  };

  const handleDeleteCat = async (id: string) => {
    try {
      await deleteCategory(id).unwrap();
      toast.success('Category deleted');
      setDeleteCatId(null);
      if (filterCategory) setFilterCategory('');
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed');
    }
  };

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // summary cards: top categories by amount in current view
  const catSummary = (categories as any[])
    .map((c) => ({
      cat: c,
      amt: incomes.filter((e: any) => e.category === c.name).reduce((s: number, e: any) => s + Number(e.debit), 0),
    }))
    .filter((x) => x.amt > 0)
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 4);

  const inputCls = 'w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]';

  return (
    <div>
      <PageHeader
        title={t('accounting.income.title')}
        subtitle={t('accounting.income.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.accounting'), path: '/admin/accounting/accounts' },
          { label: t('accounting.income.title') },
        ]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowManage(true)}
              className="flex items-center gap-2 px-3 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              <Settings2 className="h-4 w-4" /> Categories
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]"
            >
              <Plus className="h-4 w-4" /> {t('accounting.income.addIncome')}
            </button>
          </div>
        }
      />

      {/* Category summary cards */}
      {catSummary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {catSummary.map(({ cat, amt }) => (
            <button
              key={cat.id}
              onClick={() => { setFilterCategory(filterCategory === cat.name ? '' : cat.name); setPage(1); }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                filterCategory === cat.name ? 'shadow-sm' : 'bg-white border-[#DBDFE9] hover:border-gray-300'
              }`}
              style={filterCategory === cat.name ? { borderColor: cat.color, backgroundColor: `${cat.color}0f` } : {}}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color ?? '#9ca3af' }} />
                <p className="text-xs text-gray-500 truncate">{cat.name}</p>
              </div>
              <p className="text-xl font-bold text-green-600">৳{amt.toLocaleString('en-BD')}</p>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 flex-1">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('accounting.income.searchPlaceholder')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] min-w-[140px]"
              >
                <option value="">All Categories</option>
                {(categories as any[]).map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              {filterCategory && (
                <button onClick={() => { setFilterCategory(''); setPage(1); }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="Clear filter">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-600">
              {t('common.total')}: ৳{totalIncome.toLocaleString('en-BD')}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {[t('common.date'), t('common.category'), t('common.account'), t('common.amount'), t('common.note'), t('common.action')].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" /></td></tr>
              ) : incomes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">{t('accounting.income.noRecords')}</td></tr>
              ) : (
                incomes.map((item: any) => {
                  const cat = (categories as any[]).find((c) => c.name === item.category);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(item.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <CategoryBadge name={item.category} color={cat?.color} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{item.account?.name ?? '—'}</td>
                      <td className="px-4 py-3 font-bold text-green-600">৳{Number(item.debit).toLocaleString('en-BD')}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{item.note || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteItem(item)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {t('common.page')} {meta.currentPage} {t('common.of')} {meta.totalPages} ({meta.totalItems} {t('common.records')})
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50">{t('common.prev')}</button>
              <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50">{t('common.next')}</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Record Income Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#26272F]">{t('accounting.income.recordIncome')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.date')} <span className="text-red-500">*</span></label>
                  <input type="date" value={form.transactionDate} onChange={(e) => f('transactionDate', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.amount')} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">৳</span>
                    <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => f('amount', e.target.value)}
                      placeholder="0.00" className={`${inputCls} pl-7`} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.category')}</label>
                <CategorySelect type="income" value={form.category} onChange={(v) => f('category', v)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.account')} <span className="text-red-500">*</span></label>
                <select value={form.accountId} onChange={(e) => f('accountId', e.target.value)} className={inputCls}>
                  <option value="">{t('common.selectAccount')}</option>
                  {cashAccounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.note')}</label>
                <input type="text" value={form.note} onChange={(e) => f('note', e.target.value)}
                  placeholder="Description" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t('accounting.income.saveIncome')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Categories Panel ─────────────────────────────────────────── */}
      {showManage && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#26272F] flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-[#ff6d29]" /> Income Categories
              </h2>
              <button onClick={() => setShowManage(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(categories as any[]).length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">No categories yet</p>
              )}
              {(categories as any[]).map((cat) => (
                <div key={cat.id} className="border border-[#DBDFE9] rounded-lg p-3">
                  {editCatId === cat.id ? (
                    <div className="space-y-2">
                      <input autoFocus value={editCatName} onChange={(e) => setEditCatName(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]" />
                      <div className="flex flex-wrap gap-1.5">
                        {PALETTE.map((c) => (
                          <button key={c} type="button" onClick={() => setEditCatColor(c)}
                            className={`h-5 w-5 rounded-full border-2 ${editCatColor === c ? 'border-gray-700' : 'border-transparent'}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateCat(cat.id)} disabled={updatingCat}
                          className="flex-1 py-1.5 bg-[#ff6d29] text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-60">
                          {updatingCat ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                        </button>
                        <button onClick={() => setEditCatId(null)}
                          className="flex-1 py-1.5 border border-[#DBDFE9] text-gray-600 rounded-lg text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : deleteCatId === cat.id ? (
                    <div className="text-center space-y-2">
                      <p className="text-xs text-gray-600">Delete "<strong>{cat.name}</strong>"?</p>
                      <p className="text-xs text-gray-400">Existing records keep their category label.</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleDeleteCat(cat.id)} disabled={deletingCat}
                          className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-xs flex items-center justify-center gap-1 disabled:opacity-60">
                          {deletingCat ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Delete
                        </button>
                        <button onClick={() => setDeleteCatId(null)}
                          className="flex-1 py-1.5 border border-[#DBDFE9] text-gray-600 rounded-lg text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color ?? '#9ca3af' }} />
                        <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); setEditCatColor(cat.color ?? PALETTE[0]); }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteCatId(cat.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600">Add New Category</p>
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCat(); }}
                placeholder="Category name"
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm bg-white focus:outline-none focus:border-[#ff6d29]" />
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((c) => (
                  <button key={c} type="button" onClick={() => setNewCatColor(c)}
                    className={`h-5 w-5 rounded-full border-2 ${newCatColor === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <button onClick={handleCreateCat} disabled={creatingCat || !newCatName.trim()}
                className="w-full py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50 flex items-center justify-center gap-2">
                {creatingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Transaction Confirm ──────────────────────────────────────── */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('accounting.income.deleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-6">{t('accounting.income.deleteWarning')}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteItem(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm">{t('common.cancel')}</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60 flex items-center gap-2">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />} {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;
