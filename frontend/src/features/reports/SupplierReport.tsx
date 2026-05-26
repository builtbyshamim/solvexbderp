import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

const reportData = [
  { id: 1, name: 'Rahim Trading', phone: '01811-111111', total_purchase: 45000, paid: 45000, due: 0, last_purchase: '2025-05-15' },
  { id: 2, name: 'Tech Supplies BD', phone: '01822-222222', total_purchase: 28500, paid: 15000, due: 13500, last_purchase: '2025-05-18' },
  { id: 3, name: 'Global Imports', phone: '01833-333333', total_purchase: 72000, paid: 0, due: 72000, last_purchase: '2025-05-22' },
];

const SupplierReport = () => {
  const [search, setSearch] = useState('');
  const filtered = reportData.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search),
  );
  const totals = filtered.reduce(
    (s, r) => ({ total_purchase: s.total_purchase + r.total_purchase, paid: s.paid + r.paid, due: s.due + r.due }),
    { total_purchase: 0, paid: 0, due: 0 },
  );

  return (
    <div>
      <PageHeader
        title="Supplier Report"
        subtitle="Supplier-wise purchase summary and payable balance"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Reports' }, { label: 'Supplier Report' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Purchase', value: totals.total_purchase, cls: 'text-[#26272F]' },
          { label: 'Total Paid', value: totals.paid, cls: 'text-green-600' },
          { label: 'Total Payable', value: totals.due, cls: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>৳{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Supplier', 'Phone', 'Total Purchase', 'Paid', 'Payable', 'Last Purchase'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#26272F]">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.phone}</td>
                  <td className="px-4 py-3 font-semibold">৳{row.total_purchase.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{row.paid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500">৳{row.due.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{row.last_purchase}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-[#DBDFE9] font-bold">
                <td colSpan={2} className="px-4 py-3">Total</td>
                <td className="px-4 py-3">৳{totals.total_purchase.toLocaleString()}</td>
                <td className="px-4 py-3 text-green-600">৳{totals.paid.toLocaleString()}</td>
                <td className="px-4 py-3 text-red-500">৳{totals.due.toLocaleString()}</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplierReport;
