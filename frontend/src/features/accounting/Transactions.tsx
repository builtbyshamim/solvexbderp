import { useState } from 'react';
import { Search, Download, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Loader2, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useGetTransactionsQuery, useGetAccountSummaryQuery, useDeleteTransactionMutation } from './accountingApi';

const typeColors: Record<string, string> = {
  income: 'bg-green-100 text-green-700',
  expense: 'bg-red-100 text-red-500',
  sale_payment: 'bg-blue-100 text-blue-700',
  purchase_payment: 'bg-orange-100 text-orange-600',
  transfer_in: 'bg-teal-100 text-teal-700',
  transfer_out: 'bg-gray-100 text-gray-600',
  opening: 'bg-purple-100 text-purple-700',
  adjustment: 'bg-yellow-100 text-yellow-700',
};

const Transactions = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const { data: txRes, isLoading } = useGetTransactionsQuery({
    search,
    transactionType: typeFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit: 25,
  });
  const transactions = txRes?.data ?? [];
  const meta = txRes?.meta;

  const { data: summary } = useGetAccountSummaryQuery(undefined);
  const [deleteTransaction, { isLoading: deleting }] = useDeleteTransactionMutation();

  const totalIncome = summary?.summary?.totalIncome ?? 0;
  const totalExpense = summary?.summary?.totalExpense ?? 0;

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteTransaction(deleteItem.id).unwrap();
      toast.success('Transaction deleted');
      setDeleteItem(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="All financial transactions overview"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Accounting', path: '/admin/accounting/accounts' },
          { label: 'Transactions' },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
            <ArrowDownRight className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-green-600">Total Income</p>
            <p className="text-xl font-bold text-green-700">৳{Number(totalIncome).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
            <ArrowUpRight className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-red-500">Total Expense</p>
            <p className="text-xl font-bold text-red-600">৳{Number(totalExpense).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-600">Net Balance</p>
            <p className="text-xl font-bold text-blue-700">
              ৳{(Number(totalIncome) - Number(totalExpense)).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="sale_payment">Sale Payment</option>
            <option value="purchase_payment">Purchase Payment</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none"
            placeholder="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none"
            placeholder="To date"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Date', 'Type', 'Account', 'Category', 'Debit (In)', 'Credit (Out)', 'Note', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(item.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${typeColors[item.transactionType] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.transactionType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{item.account?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.category || '—'}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">
                      {Number(item.debit) > 0 ? `৳${Number(item.debit).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-red-500 font-medium">
                      {Number(item.credit) > 0 ? `৳${Number(item.credit).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{item.note || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteItem(item)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
              {meta.totalItems} records — Page {meta.currentPage} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Delete Transaction?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will reverse the balance effect. Cannot be undone.
            </p>
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

export default Transactions;
