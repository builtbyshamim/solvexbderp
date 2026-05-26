import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

interface LedgerEntry {
  id: number;
  date: string;
  reference: string;
  type: 'sale' | 'payment' | 'return';
  debit: number;
  credit: number;
  balance: number;
  note: string;
}

const ledgerData: LedgerEntry[] = [
  { id: 1, date: '2025-05-01', reference: 'OPENING', type: 'sale', debit: 0, credit: 0, balance: 0, note: 'Opening balance' },
  { id: 2, date: '2025-05-20', reference: 'INV-2025-001', type: 'sale', debit: 11500, credit: 0, balance: 11500, note: 'Sale invoice' },
  { id: 3, date: '2025-05-20', reference: 'PAY-001', type: 'payment', debit: 0, credit: 11500, balance: 0, note: 'Cash payment' },
  { id: 4, date: '2025-05-22', reference: 'INV-2025-003', type: 'sale', debit: 21000, credit: 0, balance: 21000, note: 'Sale invoice' },
  { id: 5, date: '2025-05-23', reference: 'SRN-001', type: 'return', debit: 0, credit: 3500, balance: 17500, note: 'Return deduction' },
];

const typeColors = { sale: 'bg-blue-100 text-blue-700', payment: 'bg-green-100 text-green-700', return: 'bg-orange-100 text-orange-600' };

const CustomerLedger = () => {
  const [customer, setCustomer] = useState('Abdullah Al Mamun');
  const [search, setSearch] = useState('');
  const filtered = ledgerData.filter((e) => e.reference.toLowerCase().includes(search.toLowerCase()) || e.note.toLowerCase().includes(search.toLowerCase()));
  const currentBalance = ledgerData[ledgerData.length - 1].balance;

  return (
    <div>
      <PageHeader
        title="Customer Ledger"
        subtitle="Track all transactions with customers"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Sales', path: '/admin/sales/list' }, { label: 'Customer Ledger' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />
      <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Customer</label>
            <select value={customer} onChange={(e) => setCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
              <option>Abdullah Al Mamun</option>
              <option>Fatema Begum</option>
              <option>Karim Enterprise</option>
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
          <span className="text-sm font-semibold text-[#26272F]">{customer}</span>
          <span className="text-xs text-gray-500">Current Balance:</span>
          <span className={`text-sm font-bold ${currentBalance > 0 ? 'text-orange-500' : 'text-green-600'}`}>
            ৳{currentBalance.toLocaleString()} {currentBalance > 0 ? '(Due)' : ''}
          </span>
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
                {['Date', 'Reference', 'Type', 'Debit (Receivable)', 'Credit (Received)', 'Balance', 'Note'].map((h) => (
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
                  <td className="px-4 py-3 font-medium text-orange-500">{entry.debit > 0 ? `৳${entry.debit.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 font-medium text-green-600">{entry.credit > 0 ? `৳${entry.credit.toLocaleString()}` : '—'}</td>
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

export default CustomerLedger;
