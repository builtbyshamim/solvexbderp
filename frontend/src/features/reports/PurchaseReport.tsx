import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

const reportData = [
  { date: '2025-05-15', invoice: 'PUR-001', supplier: 'Rahim Trading', items: 5, total: 45000, paid: 45000, due: 0 },
  { date: '2025-05-18', invoice: 'PUR-002', supplier: 'Tech Supplies BD', items: 3, total: 28500, paid: 15000, due: 13500 },
  { date: '2025-05-22', invoice: 'PUR-003', supplier: 'Global Imports', items: 8, total: 72000, paid: 0, due: 72000 },
];

const PurchaseReport = () => {
  const [search, setSearch] = useState('');
  const filtered = reportData.filter((r) => r.supplier.toLowerCase().includes(search.toLowerCase()) || r.invoice.toLowerCase().includes(search.toLowerCase()));
  const totals = filtered.reduce((s, r) => ({ total: s.total + r.total, paid: s.paid + r.paid, due: s.due + r.due }), { total: 0, paid: 0, due: 0 });

  return (
    <div>
      <PageHeader
        title="Purchase Report"
        subtitle="Detailed purchase analysis by date range"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Reports' }, { label: 'Purchase Report' }]}
        actions={<button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"><Download className="h-4 w-4" /> Export</button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[{ label: 'Total Purchase', value: totals.total, cls: 'text-[#26272F]' }, { label: 'Total Paid', value: totals.paid, cls: 'text-green-600' }, { label: 'Total Due', value: totals.due, cls: 'text-red-500' }].map((s) => (
          <div key={s.label} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
            <p className="text-xs text-gray-500">{s.label}</p><p className={`text-2xl font-bold mt-1 ${s.cls}`}>৳{s.value.toLocaleString()}</p>
          </div>
        ))}
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
            <thead><tr className="bg-gray-50 border-b border-[#DBDFE9]">{['Date', 'Invoice', 'Supplier', 'Items', 'Total', 'Paid', 'Due'].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{row.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#ff6d29]">{row.invoice}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{row.supplier}</td>
                  <td className="px-4 py-3 text-gray-600">{row.items}</td>
                  <td className="px-4 py-3 font-semibold">৳{row.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{row.paid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500">৳{row.due.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReport;
