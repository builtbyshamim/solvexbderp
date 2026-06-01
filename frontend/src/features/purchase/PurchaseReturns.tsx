import { useState } from 'react';
import { Search, Eye, Plus } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';

interface Return {
  id: number;
  reference: string;
  date: string;
  purchase_invoice: string;
  supplier: string;
  items: number;
  total: number;
  status: 'approved' | 'pending' | 'rejected';
  reason: string;
}

const returns: Return[] = [
  { id: 1, reference: 'PRN-001', date: '2025-05-20', purchase_invoice: 'PUR-2025-001', supplier: 'Rahim Trading', items: 3, total: 4500, status: 'approved', reason: 'Defective products' },
  { id: 2, reference: 'PRN-002', date: '2025-05-22', purchase_invoice: 'PUR-2025-002', supplier: 'Tech Supplies BD', items: 1, total: 1200, status: 'pending', reason: 'Wrong item delivered' },
];

const statusColors = { approved: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', rejected: 'bg-red-100 text-red-500' };

const PurchaseReturns = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const filtered = returns.filter((r) => r.reference.toLowerCase().includes(search.toLowerCase()) || r.supplier.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title={t('purchase.returns.title')}
        subtitle={t('purchase.returns.subtitle')}
        breadcrumbs={[{ label: t('common.home'), path: '/admin' }, { label: t('nav.purchase'), path: '/admin/purchase/list' }, { label: t('purchase.returns.title') }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> {t('purchase.returns.newReturn')}
          </button>
        }
      />
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('purchase.returns.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {[t('inventory.stockAdj.colReference'), t('common.date'), t('purchase.returns.colPurchaseInvoice'), t('common.supplier'), t('purchase.returns.colItems'), t('common.total'), t('purchase.returns.colReason'), t('common.status'), t('common.action')].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">{t('purchase.returns.noReturns')}</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.reference}</td>
                    <td className="px-4 py-3 text-gray-600">{item.date}</td>
                    <td className="px-4 py-3 text-[#ff6d29] font-mono text-xs">{item.purchase_invoice}</td>
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.supplier}</td>
                    <td className="px-4 py-3 text-gray-600">{item.items}</td>
                    <td className="px-4 py-3 font-semibold">৳{item.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status]}`}>{item.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View"><Eye className="h-4 w-4" /></button>
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

export default PurchaseReturns;
