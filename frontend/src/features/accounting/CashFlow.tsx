import { Download } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

const CashFlow = () => {
  const operating = [
    { label: 'Cash received from customers', amount: 157000 },
    { label: 'Cash paid to suppliers', amount: -90500 },
    { label: 'Cash paid for expenses', amount: -56300 },
  ];
  const investing = [
    { label: 'Purchase of equipment', amount: -15000 },
  ];
  const financing = [
    { label: 'Capital invested', amount: 50000 },
    { label: 'Loan repayments', amount: 0 },
  ];

  const operatingTotal = operating.reduce((s, o) => s + o.amount, 0);
  const investingTotal = investing.reduce((s, i) => s + i.amount, 0);
  const financingTotal = financing.reduce((s, f) => s + f.amount, 0);
  const netCashFlow = operatingTotal + investingTotal + financingTotal;

  const Section = ({ title, items, total, color }: { title: string; items: { label: string; amount: number }[]; total: number; color: string }) => (
    <div className="bg-white border border-[#DBDFE9] rounded-lg overflow-hidden">
      <div className={`px-5 py-4 border-b border-[#DBDFE9] ${color}`}>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className={`font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {item.amount >= 0 ? '+' : ''}৳{item.amount.toLocaleString()}
            </span>
          </div>
        ))}
        <div className="border-t border-[#DBDFE9] pt-2 flex justify-between font-bold">
          <span>Net Cash Flow</span>
          <span className={total >= 0 ? 'text-green-600' : 'text-red-500'}>
            {total >= 0 ? '+' : ''}৳{total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Cash Flow Statement"
        subtitle="Track cash inflows and outflows"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Accounting', path: '/admin/accounting/accounts' }, { label: 'Cash Flow' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className={`mb-6 border rounded-lg p-5 ${netCashFlow >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <p className={`text-sm font-medium ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-500'}`}>Net Change in Cash</p>
        <p className={`text-3xl font-bold mt-1 ${netCashFlow >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          {netCashFlow >= 0 ? '+' : ''}৳{netCashFlow.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Section title="Operating Activities" items={operating} total={operatingTotal} color="bg-blue-50 text-blue-700" />
        <Section title="Investing Activities" items={investing} total={investingTotal} color="bg-purple-50 text-purple-700" />
        <Section title="Financing Activities" items={financing} total={financingTotal} color="bg-orange-50 text-orange-700" />
      </div>
    </div>
  );
};

export default CashFlow;
