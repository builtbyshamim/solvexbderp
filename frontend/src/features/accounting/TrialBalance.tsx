import { Download } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

const accounts = [
  { name: 'Cash', type: 'Asset', debit: 78500, credit: 0 },
  { name: 'Bank Account', type: 'Asset', debit: 345000, credit: 0 },
  { name: 'Accounts Receivable', type: 'Asset', debit: 24500, credit: 0 },
  { name: 'Inventory', type: 'Asset', debit: 208500, credit: 0 },
  { name: 'Equipment', type: 'Asset', debit: 50000, credit: 0 },
  { name: 'Accounts Payable', type: 'Liability', debit: 0, credit: 67500 },
  { name: 'Capital', type: 'Equity', debit: 0, credit: 500000 },
  { name: 'Sales Revenue', type: 'Income', debit: 0, credit: 157000 },
  { name: 'Cost of Goods Sold', type: 'Expense', debit: 90500, credit: 0 },
  { name: 'Operating Expenses', type: 'Expense', debit: 56300, credit: 0 },
  { name: 'Retained Earnings', type: 'Equity', debit: 0, credit: 131300 },
];

const typeColors: Record<string, string> = {
  Asset: 'bg-blue-100 text-blue-700',
  Liability: 'bg-red-100 text-red-500',
  Equity: 'bg-purple-100 text-purple-700',
  Income: 'bg-green-100 text-green-700',
  Expense: 'bg-orange-100 text-orange-600',
};

const TrialBalance = () => {
  const totalDebit = accounts.reduce((s, a) => s + a.debit, 0);
  const totalCredit = accounts.reduce((s, a) => s + a.credit, 0);
  const isBalanced = totalDebit === totalCredit;

  return (
    <div>
      <PageHeader
        title="Trial Balance"
        subtitle="Verify that total debits equal total credits"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Accounting', path: '/admin/accounting/accounts' }, { label: 'Trial Balance' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className={`mb-6 border rounded-lg p-4 flex items-center gap-3 ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className={`h-3 w-3 rounded-full ${isBalanced ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className={`text-sm font-medium ${isBalanced ? 'text-green-700' : 'text-red-600'}`}>
          {isBalanced ? 'Trial Balance is Balanced ✓' : 'Trial Balance is NOT balanced — please review'}
        </span>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Account Name', 'Type', 'Debit (৳)', 'Credit (৳)'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map((account) => (
                <tr key={account.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#26272F]">{account.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[account.type]}`}>{account.type}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{account.debit > 0 ? `৳${account.debit.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 font-medium">{account.credit > 0 ? `৳${account.credit.toLocaleString()}` : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 border-t-2 border-[#DBDFE9] font-bold">
                <td colSpan={2} className="px-4 py-4 text-[#26272F]">TOTALS</td>
                <td className="px-4 py-4 text-[#26272F] text-base">৳{totalDebit.toLocaleString()}</td>
                <td className="px-4 py-4 text-[#26272F] text-base">৳{totalCredit.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrialBalance;
