import { useState } from 'react';
import { Search, Plus, Trash2, Loader2, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import {
  useGetAllAccountsQuery,
  useGetIncomesQuery,
  useRecordIncomeMutation,
  useDeleteTransactionMutation,
} from './accountingApi';
import { useLanguage } from '../../context/LanguageContext';

const INCOME_CATEGORIES = ['Sales', 'Service', 'Commission', 'Refund', 'Investment', 'Other'];

const typeColorMap: Record<string, string> = {
  Sales: 'bg-green-50 text-green-700',
  Service: 'bg-blue-50 text-blue-700',
  Commission: 'bg-purple-50 text-purple-700',
  Refund: 'bg-yellow-50 text-yellow-700',
  Investment: 'bg-indigo-50 text-indigo-700',
  Other: 'bg-gray-100 text-gray-600',
};

const emptyForm = {
  transactionDate: new Date().toISOString().split('T')[0],
  category: 'Sales',
  accountId: '',
  amount: '',
  note: '',
};

const Income = () => {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [page, setPage] = useState(1);

  const { data: accountsData = [] } = useGetAllAccountsQuery({});
  const cashAccounts = accountsData?.data?.filter((a: any) =>
    ['cash', 'bank', 'mobile_banking'].includes(a.accountType),
  );

  const { data: incomesRes, isLoading } = useGetIncomesQuery({ search, page, limit: 20 });
  const incomes = incomesRes?.data?.data ?? [];
  const meta = incomesRes?.data?.meta;

  const [recordIncome, { isLoading: saving }] = useRecordIncomeMutation();
  const [deleteTransaction, { isLoading: deleting }] = useDeleteTransactionMutation();

  const totalIncome = incomes.reduce((s: number, e: any) => s + Number(e.debit), 0);

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    if (!form.accountId) {
      toast.error('Please select an account');
      return;
    }
    try {
      await recordIncome({
        accountId: form.accountId,
        transactionDate: form.transactionDate,
        amount: Number(form.amount),
        category: form.category,
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

  const f = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const tableHeaders = [
    t('common.date'),
    t('common.category'),
    t('common.account'),
    t('common.amount'),
    t('common.note'),
    t('common.action'),
  ];

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
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]"
          >
            <Plus className="h-4 w-4" /> {t('accounting.income.addIncome')}
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {INCOME_CATEGORIES.slice(0, 4).map((cat) => {
          const amt = incomes
            .filter((e: any) => e.category === cat)
            .reduce((s: number, e: any) => s + Number(e.debit), 0);
          return (
            <div key={cat} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
              <p className="text-xs text-gray-500">{cat}</p>
              <p className="text-xl font-bold text-green-600 mt-1">৳{amt.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('accounting.income.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-600">
              {t('common.total')}: ৳{totalIncome.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {tableHeaders.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" />
                  </td>
                </tr>
              ) : incomes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {t('accounting.income.noRecords')}
                  </td>
                </tr>
              ) : (
                incomes.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(item.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-medium ${typeColorMap[item.category] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {item.category || 'Other'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{item.account?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-green-600">
                      ৳{Number(item.debit).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">
                      {item.note || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteItem(item)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {t('common.page')} {meta.currentPage} {t('common.of')} {meta.totalPages} (
              {meta.totalItems} {t('common.records')})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                {t('common.prev')}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">
              {t('accounting.income.recordIncome')}
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('common.date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.transactionDate}
                    onChange={(e) => f('transactionDate', e.target.value)}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('common.category')}
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => f('category', e.target.value)}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                  >
                    {INCOME_CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('common.account')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.accountId}
                  onChange={(e) => f('accountId', e.target.value)}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                >
                  <option value="">{t('common.selectAccount')}</option>
                  {cashAccounts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('common.amount')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => f('amount', e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('common.note')}
                </label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => f('note', e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}{' '}
                {t('accounting.income.saveIncome')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('accounting.income.deleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-6">{t('accounting.income.deleteWarning')}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60 flex items-center gap-2"
              >
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
