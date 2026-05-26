import { Download } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

const BalanceSheet = () => {
  const assets = {
    current: [
      { name: 'Cash & Cash Equivalents', amount: 78500 },
      { name: 'Bank Accounts', amount: 345000 },
      { name: 'Accounts Receivable', amount: 24500 },
      { name: 'Inventory', amount: 208500 },
    ],
    fixed: [
      { name: 'Equipment', amount: 50000 },
      { name: 'Furniture', amount: 25000 },
    ],
  };

  const liabilities = {
    current: [
      { name: 'Accounts Payable', amount: 67500 },
      { name: 'Short-term Loans', amount: 0 },
    ],
    long_term: [
      { name: 'Long-term Loans', amount: 0 },
    ],
  };

  const totalCurrentAssets = assets.current.reduce((s, a) => s + a.amount, 0);
  const totalFixedAssets = assets.fixed.reduce((s, a) => s + a.amount, 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;
  const totalCurrentLiabilities = liabilities.current.reduce((s, l) => s + l.amount, 0);
  const totalLongTermLiabilities = liabilities.long_term.reduce((s, l) => s + l.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
  const equity = totalAssets - totalLiabilities;

  return (
    <div>
      <PageHeader
        title="Balance Sheet"
        subtitle="Assets, liabilities and equity overview"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Accounting', path: '/admin/accounting/accounts' }, { label: 'Balance Sheet' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><p className="text-xs text-blue-600">Total Assets</p><p className="text-2xl font-bold text-blue-700 mt-1">৳{totalAssets.toLocaleString()}</p></div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-xs text-red-500">Total Liabilities</p><p className="text-2xl font-bold text-red-600 mt-1">৳{totalLiabilities.toLocaleString()}</p></div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4"><p className="text-xs text-green-600">Equity</p><p className="text-2xl font-bold text-green-700 mt-1">৳{equity.toLocaleString()}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-[#DBDFE9] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DBDFE9] bg-blue-50">
            <h3 className="font-semibold text-blue-700 text-sm">ASSETS</h3>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Assets</h4>
              <div className="space-y-2">
                {assets.current.map((a) => (
                  <div key={a.name} className="flex justify-between text-sm"><span className="text-gray-600">{a.name}</span><span className="font-medium">৳{a.amount.toLocaleString()}</span></div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold text-sm"><span>Total Current Assets</span><span>৳{totalCurrentAssets.toLocaleString()}</span></div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fixed Assets</h4>
              <div className="space-y-2">
                {assets.fixed.map((a) => (
                  <div key={a.name} className="flex justify-between text-sm"><span className="text-gray-600">{a.name}</span><span className="font-medium">৳{a.amount.toLocaleString()}</span></div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold text-sm"><span>Total Fixed Assets</span><span>৳{totalFixedAssets.toLocaleString()}</span></div>
              </div>
            </div>
            <div className="border-t-2 border-blue-600 pt-2 flex justify-between font-bold text-base">
              <span>Total Assets</span><span className="text-blue-600">৳{totalAssets.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DBDFE9] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DBDFE9] bg-red-50">
            <h3 className="font-semibold text-red-600 text-sm">LIABILITIES & EQUITY</h3>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Liabilities</h4>
              <div className="space-y-2">
                {liabilities.current.map((l) => (
                  <div key={l.name} className="flex justify-between text-sm"><span className="text-gray-600">{l.name}</span><span className="font-medium">৳{l.amount.toLocaleString()}</span></div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold text-sm"><span>Total Current Liabilities</span><span>৳{totalCurrentLiabilities.toLocaleString()}</span></div>
              </div>
            </div>
            <div className="border-t-2 border-red-500 pt-2 flex justify-between font-bold text-sm">
              <span>Total Liabilities</span><span className="text-red-600">৳{totalLiabilities.toLocaleString()}</span>
            </div>
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex justify-between font-bold text-base"><span className="text-green-700">Owner's Equity</span><span className="text-green-700">৳{equity.toLocaleString()}</span></div>
            </div>
            <div className="border-t-2 border-[#26272F] pt-2 flex justify-between font-bold text-base">
              <span>Total L + Equity</span><span>৳{totalAssets.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
