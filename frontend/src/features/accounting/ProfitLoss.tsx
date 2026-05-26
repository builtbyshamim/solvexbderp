import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

const ProfitLoss = () => {
  const data = {
    revenue: { sales: 160500, returns: -3500, net: 157000 },
    cogs: { purchases: 95000, returns: 4500, net: 90500 },
    gross_profit: 66500,
    expenses: [
      { name: 'Salary', amount: 35000 },
      { name: 'Rent', amount: 15000 },
      { name: 'Utility', amount: 2500 },
      { name: 'Transport', amount: 800 },
      { name: 'Marketing', amount: 3000 },
    ],
    total_expense: 56300,
    net_profit: 10200,
  };

  const profitMargin = ((data.net_profit / data.revenue.net) * 100).toFixed(1);
  const grossMargin = ((data.gross_profit / data.revenue.net) * 100).toFixed(1);

  return (
    <div>
      <PageHeader
        title="Profit & Loss Statement"
        subtitle="Financial performance overview"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Accounting', path: '/admin/accounting/accounts' }, { label: 'P&L Statement' }]}
        actions={
          <div className="flex gap-2">
            <select className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none">
              <option>May 2025</option>
              <option>April 2025</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <p className="text-xs text-green-600">Net Revenue</p>
          <p className="text-2xl font-bold text-green-700 mt-1">৳{data.revenue.net.toLocaleString()}</p>
        </div>
        <div className={`border rounded-lg p-5 ${data.net_profit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs ${data.net_profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>Net Profit</p>
          <div className="flex items-center gap-2 mt-1">
            {data.net_profit >= 0 ? <TrendingUp className="h-5 w-5 text-blue-600" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
            <p className={`text-2xl font-bold ${data.net_profit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>৳{data.net_profit.toLocaleString()}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Net Margin: {profitMargin}%</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <p className="text-xs text-purple-600">Gross Profit</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">৳{data.gross_profit.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Gross Margin: {grossMargin}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-[#DBDFE9] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
            <h3 className="font-semibold text-[#26272F] text-sm">Revenue</h3>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Sales Revenue</span><span className="font-medium">৳{data.revenue.sales.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Sales Returns</span><span className="text-red-500">৳{data.revenue.returns.toLocaleString()}</span></div>
              <div className="border-t border-[#DBDFE9] pt-2 flex justify-between font-bold"><span>Net Revenue</span><span className="text-green-600">৳{data.revenue.net.toLocaleString()}</span></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Cost of Goods Sold</span><span className="font-medium">৳{data.cogs.purchases.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Purchase Returns</span><span className="text-green-600">-৳{data.cogs.returns.toLocaleString()}</span></div>
              <div className="border-t border-[#DBDFE9] pt-2 flex justify-between font-bold"><span>Net COGS</span><span className="text-red-500">৳{data.cogs.net.toLocaleString()}</span></div>
            </div>
            <div className="mt-4 border-t-2 border-[#26272F] pt-2 flex justify-between font-bold text-base">
              <span>Gross Profit</span>
              <span className="text-green-600">৳{data.gross_profit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DBDFE9] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
            <h3 className="font-semibold text-[#26272F] text-sm">Operating Expenses</h3>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              {data.expenses.map((e) => (
                <div key={e.name} className="flex justify-between text-sm">
                  <span className="text-gray-600">{e.name}</span>
                  <span className="font-medium text-red-500">৳{e.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-[#DBDFE9] pt-2 flex justify-between font-bold">
                <span>Total Expenses</span>
                <span className="text-red-600">৳{data.total_expense.toLocaleString()}</span>
              </div>
            </div>
            <div className={`mt-4 border-t-2 pt-2 flex justify-between font-bold text-base ${data.net_profit >= 0 ? 'border-green-600' : 'border-red-500'}`}>
              <span>Net Profit / (Loss)</span>
              <span className={data.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>৳{data.net_profit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss;
