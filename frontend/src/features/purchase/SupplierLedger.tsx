import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

interface LedgerEntry {
  id: number;
  date: string;
  reference: string;
  type: 'purchase' | 'payment' | 'return';
  debit: number;
  credit: number;
  balance: number;
  note: string;
}

const ledgerData: LedgerEntry[] = [
  { id: 1, date: '2025-05-01', reference: 'OPENING', type: 'purchase', debit: 0, credit: 0, balance: 0, note: 'Opening balance' },
  { id: 2, date: '2025-05-15', reference: 'PUR-2025-001', type: 'purchase', debit: 45000, credit: 0, balance: 45000, note: 'Purchase invoice' },
  { id: 3, date: '2025-05-16', reference: 'PAY-001', type: 'payment', debit: 0, credit: 45000, balance: 0, note: 'Payment via bank transfer' },
  { id: 4, date: '2025-05-22', reference: 'PUR-2025-003', type: 'purchase', debit: 72000, credit: 0, balance: 72000, note: 'Purchase invoice' },
  { id: 5, date: '2025-05-24', reference: 'PRN-001', type: 'return', debit: 0, credit: 4500, balance: 67500, note: 'Return credit' },
];

const typeColors = { purchase: 'bg-blue-100 text-blue-700', payment: 'bg-green-100 text-green-700', return: 'bg-orange-100 text-orange-600' };

const SupplierLedger = () => {
  const [supplier, setSupplier] = useState('Rahim Trading');
  const [search, setSearch] = useState('');

  const filtered = ledgerData.filter((e) => e.reference.toLowerCase().includes(search.toLowerCase()) || e.note.toLowerCase().includes(search.toLowerCase()));
  const currentBalance = ledgerData[ledgerData.length - 1].balance;

  return (
    <div>
      <PageHeader
        title="Supplier Ledger"
        subtitle="Track all transactions with suppliers"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Purchase', path: '/admin/purchase/list' }, { label: 'Supplier Ledger' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Supplier</label>
            <select value={supplier} onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
              <option>Rahim Trading</option>
              <option>Tech Supplies BD</option>
              <option>Global Imports</option>
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
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-[#26272F]">{supplier}</span>
            <span className="text-xs text-gray-500 ml-2">Current Balance:</span>
            <span className={`ml-1 text-sm font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {currentBalance > 0 ? `-৳${currentBalance.toLocaleString()}` : `৳${Math.abs(currentBalance).toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Date', 'Reference', 'Type', 'Debit (Payable)', 'Credit (Paid)', 'Balance', 'Note'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{entry.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#ff6d29]">{entry.reference}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${typeColors[entry.type]}`}>{entry.type}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-red-600">{entry.debit > 0 ? `৳${entry.debit.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 font-medium text-green-600">{entry.credit > 0 ? `৳${entry.credit.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 font-bold text-[#26272F]">৳{entry.balance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{entry.note}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-[#DBDFE9]">
                <td colSpan={3} className="px-4 py-3 font-semibold text-gray-700">Total</td>
                <td className="px-4 py-3 font-bold text-red-600">৳{filtered.reduce((s, e) => s + e.debit, 0).toLocaleString()}</td>
                <td className="px-4 py-3 font-bold text-green-600">৳{filtered.reduce((s, e) => s + e.credit, 0).toLocaleString()}</td>
                <td className="px-4 py-3 font-bold text-[#26272F]">৳{currentBalance.toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplierLedger;
