import { useState } from 'react';
import { Download, TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useGetProfitLossQuery } from './accountingApi';

const ProfitLoss = () => {
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
  );
  const [dateTo, setDateTo] = useState(now.toISOString().split('T')[0]);

  const { data, isLoading, refetch } = useGetProfitLossQuery(
    { dateFrom, dateTo },
    { skip: !dateFrom || !dateTo },
  );

  const d = data ?? {
    revenue: { sales: 0, net: 0 },
    cogs: { net: 0 },
    grossProfit: 0,
    otherIncome: 0,
    expenses: [],
    totalExpenses: 0,
    netProfit: 0,
    grossMargin: '0',
    netMargin: '0',
  };

  return (
    <div>
      <PageHeader
        title="Profit & Loss Statement"
        subtitle="Financial performance overview"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Accounting', path: '/admin/accounting/accounts' },
          { label: 'P&L Statement' },
        ]}
        actions={
          <div className="flex gap-2 flex-wrap">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none"
            />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <p className="text-xs text-green-600">Net Revenue</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                ৳{Number(d.revenue.net).toLocaleString()}
              </p>
            </div>
            <div className={`border rounded-lg p-5 ${d.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs ${d.netProfit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>Net Profit</p>
              <div className="flex items-center gap-2 mt-1">
                {d.netProfit >= 0
                  ? <TrendingUp className="h-5 w-5 text-blue-600" />
                  : <TrendingDown className="h-5 w-5 text-red-500" />
                }
                <p className={`text-2xl font-bold ${d.netProfit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                  ৳{Number(d.netProfit).toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Net Margin: {d.netMargin}%</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
              <p className="text-xs text-purple-600">Gross Profit</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                ৳{Number(d.grossProfit).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Gross Margin: {d.grossMargin}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-[#DBDFE9] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
                <h3 className="font-semibold text-[#26272F] text-sm">Revenue & COGS</h3>
              </div>
              <div className="p-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sales Revenue</span>
                    <span className="font-medium">৳{Number(d.revenue.sales).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#DBDFE9] pt-2 flex justify-between font-bold">
                    <span>Net Revenue</span>
                    <span className="text-green-600">৳{Number(d.revenue.net).toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cost of Goods Sold (COGS)</span>
                    <span className="text-red-500 font-medium">৳{Number(d.cogs.net).toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4 border-t-2 border-[#26272F] pt-2 flex justify-between font-bold text-base">
                  <span>Gross Profit</span>
                  <span className="text-green-600">৳{Number(d.grossProfit).toLocaleString()}</span>
                </div>
                {Number(d.otherIncome) > 0 && (
                  <div className="mt-3 flex justify-between text-sm text-gray-600">
                    <span>Other Income</span>
                    <span className="font-medium text-green-600">+৳{Number(d.otherIncome).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#DBDFE9] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
                <h3 className="font-semibold text-[#26272F] text-sm">Operating Expenses</h3>
              </div>
              <div className="p-5">
                {d.expenses.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No expenses recorded in this period.</p>
                ) : (
                  <div className="space-y-2">
                    {d.expenses.map((e: any) => (
                      <div key={e.category} className="flex justify-between text-sm">
                        <span className="text-gray-600">{e.category}</span>
                        <span className="font-medium text-red-500">৳{Number(e.amount).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t border-[#DBDFE9] pt-2 flex justify-between font-bold">
                      <span>Total Expenses</span>
                      <span className="text-red-600">৳{Number(d.totalExpenses).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                <div className={`mt-4 border-t-2 pt-2 flex justify-between font-bold text-base ${d.netProfit >= 0 ? 'border-green-600' : 'border-red-500'}`}>
                  <span>Net Profit / (Loss)</span>
                  <span className={d.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ৳{Number(d.netProfit).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfitLoss;
