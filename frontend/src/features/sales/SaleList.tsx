import { useState } from 'react';
import { Search, Eye, Plus, Download } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { Link } from 'react-router-dom';

interface Sale {
  id: number;
  invoice_no: string;
  date: string;
  customer: string;
  items: number;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  profit: number;
  status: 'completed' | 'partial' | 'due' | 'returned';
}

const sales: Sale[] = [
  { id: 1, invoice_no: 'INV-2025-001', date: '2025-05-20', customer: 'Abdullah Al Mamun', items: 3, subtotal: 12000, discount: 500, total: 11500, paid: 11500, due: 0, profit: 3200, status: 'completed' },
  { id: 2, invoice_no: 'INV-2025-002', date: '2025-05-21', customer: 'Fatema Begum', items: 2, subtotal: 8500, discount: 0, total: 8500, paid: 5000, due: 3500, profit: 2100, status: 'partial' },
  { id: 3, invoice_no: 'INV-2025-003', date: '2025-05-22', customer: 'Walk-in Customer', items: 5, subtotal: 22000, discount: 1000, total: 21000, paid: 0, due: 21000, profit: 6500, status: 'due' },
  { id: 4, invoice_no: 'INV-2025-004', date: '2025-05-24', customer: 'Karim Enterprise', items: 1, subtotal: 5500, discount: 0, total: 5500, paid: 5500, due: 0, profit: 1800, status: 'completed' },
];

const statusColors = { completed: 'bg-green-100 text-green-700', partial: 'bg-yellow-100 text-yellow-700', due: 'bg-red-100 text-red-500', returned: 'bg-gray-100 text-gray-500' };

const SaleList = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = sales.filter((s) => {
    const matchSearch = s.invoice_no.toLowerCase().includes(search.toLowerCase()) || s.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || s.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const totalSales = sales.reduce((s, i) => s + i.total, 0);
  const totalProfit = sales.reduce((s, i) => s + i.profit, 0);
  const totalDue = sales.reduce((s, i) => s + i.due, 0);

  return (
    <div>
      <PageHeader
        title="Sale List"
        subtitle="View and manage all sales invoices"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Sales' }, { label: 'Sale List' }]}
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" /> Export
            </button>
            <Link to="/admin/sales/add" className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
              <Plus className="h-4 w-4" /> New Sale
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: `৳${totalSales.toLocaleString()}`, cls: 'text-[#26272F]' },
          { label: 'Total Profit', value: `৳${totalProfit.toLocaleString()}`, cls: 'text-green-600' },
          { label: 'Total Due', value: `৳${totalDue.toLocaleString()}`, cls: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search invoice or customer..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none">
            {['All', 'Completed', 'Partial', 'Due', 'Returned'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Invoice', 'Date', 'Customer', 'Total', 'Paid', 'Due', 'Profit', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No sales found</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[#ff6d29]">{item.invoice_no}</td>
                    <td className="px-4 py-3 text-gray-600">{item.date}</td>
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.customer}</td>
                    <td className="px-4 py-3 font-semibold">৳{item.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600">৳{item.paid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-500">৳{item.due.toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">৳{item.profit.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status]}`}>{item.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Eye className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SaleList;
