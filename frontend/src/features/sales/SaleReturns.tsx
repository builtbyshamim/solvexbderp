import { useState } from 'react';
import { Search, Eye, Plus } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';

interface SaleReturn {
  id: number;
  reference: string;
  date: string;
  sale_invoice: string;
  customer: string;
  items: number;
  total: number;
  status: 'approved' | 'pending' | 'rejected';
  reason: string;
}

const returns: SaleReturn[] = [
  { id: 1, reference: 'SRN-001', date: '2025-05-21', sale_invoice: 'INV-2025-001', customer: 'Abdullah Al Mamun', items: 1, total: 3500, status: 'approved', reason: 'Customer returned defective item' },
  { id: 2, reference: 'SRN-002', date: '2025-05-23', sale_invoice: 'INV-2025-002', customer: 'Fatema Begum', items: 2, total: 1800, status: 'pending', reason: 'Wrong size delivered' },
];

const statusColors = { approved: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', rejected: 'bg-red-100 text-red-500' };

const SaleReturns = () => {
  const [search, setSearch] = useState('');
  const filtered = returns.filter((r) => r.reference.toLowerCase().includes(search.toLowerCase()) || r.customer.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Sale Returns"
        subtitle="Manage returned items from customers"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Sales', path: '/admin/sales/list' }, { label: 'Returns' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> New Return
          </button>
        }
      />
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search returns..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Reference', 'Date', 'Sale Invoice', 'Customer', 'Items', 'Total', 'Reason', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No returns found</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.reference}</td>
                    <td className="px-4 py-3 text-gray-600">{item.date}</td>
                    <td className="px-4 py-3 text-[#ff6d29] font-mono text-xs">{item.sale_invoice}</td>
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.customer}</td>
                    <td className="px-4 py-3 text-gray-600">{item.items}</td>
                    <td className="px-4 py-3 font-semibold">৳{item.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.reason}</td>
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

export default SaleReturns;
