import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

const ledgerData = [
  { id: 1, date: '2025-05-01', ref: 'OPENING', type: 'Opening', debit: 50000, credit: 0, balance: 50000, note: 'Opening balance' },
  { id: 2, date: '2025-05-20', ref: 'INV-001', type: 'Sale', debit: 11500, credit: 0, balance: 61500, note: 'Cash sale received' },
  { id: 3, date: '2025-05-21', ref: 'EXP-001', type: 'Expense', debit: 0, credit: 2500, balance: 59000, note: 'Electricity bill paid' },
  { id: 4, date: '2025-05-22', ref: 'INV-002', type: 'Sale', debit: 5000, credit: 0, balance: 64000, note: 'Partial payment received' },
  { id: 5, date: '2025-05-23', ref: 'EXP-002', type: 'Expense', debit: 0, credit: 8000, balance: 56000, note: 'Salary advance' },
  { id: 6, date: '2025-05-24', ref: 'TRF-001', type: 'Transfer', debit: 0, credit: 20000, balance: 36000, note: 'Transfer to bank account' },
];

const typeColors: Record<string, string> = {
  Opening: 'bg-gray-100 text-gray-600',
  Sale: 'bg-green-100 text-green-700',
  Expense: 'bg-red-100 text-red-500',
  Purchase: 'bg-blue-100 text-blue-700',
  Transfer: 'bg-orange-100 text-orange-600',
};

const AccountLedger = () => {
  const [account, setAccount] = useState('Main Cash');
  const [search, setSearch] = useState('');
  const filtered = ledgerData.filter((e) => e.ref.toLowerCase().includes(search.toLowerCase()) || e.note.toLowerCase().includes(search.toLowerCase()));
  const currentBalance = ledgerData[ledgerData.length - 1].balance;

  return (
    <div>
      <PageHeader
        title="Account Ledger"
        subtitle="Complete transaction history for each account"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Accounting', path: '/admin/accounting/accounts' }, { label: 'Account Ledger' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Account</label>
            <select value={account} onChange={(e) => setAccount(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
              <option>Main Cash</option>
              <option>Dutch Bangla Bank</option>
              <option>bKash Business</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">From Date</label>
            <input type="date" className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">To Date</label>
            <input type="date" className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-semibold text-[#26272F]">{account}</span>
          <span className="text-xs text-gray-500">Current Balance:</span>
          <span className="text-sm font-bold text-green-600">৳{currentBalance.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Date', 'Reference', 'Type', 'Debit (In)', 'Credit (Out)', 'Balance', 'Note'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{entry.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#ff6d29]">{entry.ref}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[entry.type] || 'bg-gray-100 text-gray-600'}`}>{entry.type}</span>
                  </td>
                  <td className="px-4 py-3 text-green-600 font-medium">{entry.debit > 0 ? `৳${entry.debit.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 text-red-500 font-medium">{entry.credit > 0 ? `৳${entry.credit.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 font-bold text-[#26272F]">৳{entry.balance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{entry.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountLedger;
