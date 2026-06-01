import { Download, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useGetTrialBalanceQuery } from './accountingApi';

const typeColors: Record<string, string> = {
  cash: 'bg-green-100 text-green-700',
  bank: 'bg-blue-100 text-blue-700',
  mobile_banking: 'bg-purple-100 text-purple-700',
  receivable: 'bg-teal-100 text-teal-700',
  payable: 'bg-red-100 text-red-500',
  income: 'bg-emerald-100 text-emerald-700',
  expense: 'bg-orange-100 text-orange-600',
  equity: 'bg-violet-100 text-violet-700',
};

const TrialBalance = () => {
  const { data, isLoading, refetch } = useGetTrialBalanceQuery(undefined);

  const accounts: any[] = data?.accounts ?? [];
  const totalDebit = data?.totalDebit ?? 0;
  const totalCredit = data?.totalCredit ?? 0;
  const isBalanced = data?.isBalanced ?? false;

  return (
    <div>
      <PageHeader
        title="Trial Balance"
        subtitle="Verify that total debits equal total credits"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Accounting', path: '/admin/accounting/accounts' },
          { label: 'Trial Balance' },
        ]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff6d29]" />
        </div>
      ) : (
        <>
          <div className={`mb-6 border rounded-lg p-4 flex items-center gap-3 ${isBalanced || accounts.length === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`h-3 w-3 rounded-full flex-shrink-0 ${isBalanced || accounts.length === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${isBalanced || accounts.length === 0 ? 'text-green-700' : 'text-red-600'}`}>
              {accounts.length === 0
                ? 'No accounts found. Create accounts first.'
                : isBalanced
                  ? 'Trial Balance is Balanced ✓'
                  : 'Trial Balance is NOT balanced — please review'
              }
            </span>
          </div>

          <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                    {['Account Name', 'Type', 'Debit (৳)', 'Credit (৳)', 'Current Balance'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-400">No accounts found.</td>
                    </tr>
                  ) : (
                    accounts.map((account: any) => (
                      <tr key={account.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-[#26272F]">{account.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${typeColors[account.accountType] ?? 'bg-gray-100 text-gray-600'}`}>
                            {account.accountType?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-green-600">
                          {account.totalDebit > 0 ? `৳${Number(account.totalDebit).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-red-500">
                          {account.totalCredit > 0 ? `৳${Number(account.totalCredit).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#26272F]">
                          ৳{Number(account.balance).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {accounts.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-100 border-t-2 border-[#DBDFE9] font-bold">
                      <td colSpan={2} className="px-4 py-4 text-[#26272F]">TOTALS</td>
                      <td className="px-4 py-4 text-green-600 text-base">৳{Number(totalDebit).toLocaleString()}</td>
                      <td className="px-4 py-4 text-red-500 text-base">৳{Number(totalCredit).toLocaleString()}</td>
                      <td className="px-4 py-4 text-[#26272F]">—</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrialBalance;
