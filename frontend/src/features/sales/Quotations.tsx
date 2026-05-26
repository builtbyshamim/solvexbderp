import { useState } from 'react';
import { Search, Eye, Plus, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';

interface Quotation {
  id: number;
  reference: string;
  date: string;
  valid_until: string;
  customer: string;
  items: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
}

const quotations: Quotation[] = [
  { id: 1, reference: 'QUO-001', date: '2025-05-15', valid_until: '2025-05-30', customer: 'Karim Enterprise', items: 5, total: 85000, status: 'sent' },
  { id: 2, reference: 'QUO-002', date: '2025-05-18', valid_until: '2025-06-02', customer: 'Abdullah Al Mamun', items: 2, total: 12500, status: 'accepted' },
  { id: 3, reference: 'QUO-003', date: '2025-05-20', valid_until: '2025-06-04', customer: 'New Client', items: 3, total: 24000, status: 'draft' },
];

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-500',
  converted: 'bg-purple-100 text-purple-700',
};

const Quotations = () => {
  const [search, setSearch] = useState('');
  const filtered = quotations.filter((q) => q.reference.toLowerCase().includes(search.toLowerCase()) || q.customer.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Create and manage sales quotations"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Sales', path: '/admin/sales/list' }, { label: 'Quotations' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> New Quotation
          </button>
        }
      />
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search quotations..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Reference', 'Date', 'Valid Until', 'Customer', 'Items', 'Total', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No quotations found</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[#ff6d29]">{item.reference}</td>
                    <td className="px-4 py-3 text-gray-600">{item.date}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.valid_until}</td>
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.customer}</td>
                    <td className="px-4 py-3 text-gray-600">{item.items}</td>
                    <td className="px-4 py-3 font-semibold">৳{item.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status]}`}>{item.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View"><Eye className="h-4 w-4" /></button>
                        {item.status === 'accepted' && (
                          <button onClick={() => toast.success('Converting to sale...')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Convert to Sale">
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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

export default Quotations;
