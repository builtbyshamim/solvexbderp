import { useState } from 'react';
import { Search, Plus, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';

interface Transaction {
  id: number;
  date: string;
  reference: string;
  type: 'income' | 'expense' | 'transfer';
  account: string;
  amount: number;
  category: string;
  note: string;
}

const transactions: Transaction[] = [
  { id: 1, date: '2025-05-20', reference: 'TXN-001', type: 'income', account: 'Main Cash', amount: 11500, category: 'Sales', note: 'INV-2025-001 payment' },
  { id: 2, date: '2025-05-21', reference: 'TXN-002', type: 'expense', account: 'Main Cash', amount: 2500, category: 'Utility', note: 'Electricity bill' },
  { id: 3, date: '2025-05-22', reference: 'TXN-003', type: 'income', account: 'Dutch Bangla Bank', amount: 45000, category: 'Sales', note: 'Bulk order payment' },
  { id: 4, date: '2025-05-23', reference: 'TXN-004', type: 'expense', account: 'Main Cash', amount: 8000, category: 'Salary', note: 'Staff salary advance' },
  { id: 5, date: '2025-05-24', reference: 'TXN-005', type: 'transfer', account: 'Main Cash → Bank', amount: 20000, category: 'Transfer', note: 'Transfer to bank' },
];

const typeColors = { income: 'bg-green-100 text-green-700', expense: 'bg-red-100 text-red-500', transfer: 'bg-blue-100 text-blue-700' };

const Transactions = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = transactions.filter((t) => {
    const matchSearch = t.reference.toLowerCase().includes(search.toLowerCase()) || t.note.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || t.type === typeFilter.toLowerCase();
    return matchSearch && matchType;
  });

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="All financial transactions overview"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Accounting', path: '/admin/accounting/accounts' }, { label: 'Transactions' }]}
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              <Download className="h-4 w-4" /> Export
            </button>
            <button onClick={() => toast.success('Add transaction modal coming soon')} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
              <Plus className="h-4 w-4" /> Add Transaction
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><ArrowDownRight className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-xs text-green-600">Total Income</p><p className="text-xl font-bold text-green-700">৳{totalIncome.toLocaleString()}</p></div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center"><ArrowUpRight className="h-5 w-5 text-red-500" /></div>
          <div><p className="text-xs text-red-500">Total Expense</p><p className="text-xl font-bold text-red-600">৳{totalExpense.toLocaleString()}</p></div>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none">
            {['All', 'Income', 'Expense', 'Transfer'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Date', 'Reference', 'Type', 'Account', 'Category', 'Amount', 'Note'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{item.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#ff6d29]">{item.reference}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${typeColors[item.type]}`}>{item.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{item.account}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.category}</td>
                  <td className="px-4 py-3 font-semibold">
                    <span className={item.type === 'income' ? 'text-green-600' : item.type === 'expense' ? 'text-red-500' : 'text-blue-600'}>
                      {item.type === 'expense' ? '-' : '+'}৳{item.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
