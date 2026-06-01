import { useState } from 'react';
import { Search, Eye, Plus, Download } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

interface Purchase {
  id: number;
  invoice_no: string;
  date: string;
  supplier: string;
  warehouse: string;
  total: number;
  paid: number;
  due: number;
  status: 'received' | 'partial' | 'pending' | 'returned';
}

const purchases: Purchase[] = [
  { id: 1, invoice_no: 'PUR-2025-001', date: '2025-05-15', supplier: 'Rahim Trading', warehouse: 'Main Warehouse', total: 45000, paid: 45000, due: 0, status: 'received' },
  { id: 2, invoice_no: 'PUR-2025-002', date: '2025-05-18', supplier: 'Tech Supplies BD', warehouse: 'Main Warehouse', total: 28500, paid: 15000, due: 13500, status: 'partial' },
  { id: 3, invoice_no: 'PUR-2025-003', date: '2025-05-22', supplier: 'Global Imports', warehouse: 'Branch Store', total: 72000, paid: 0, due: 72000, status: 'pending' },
  { id: 4, invoice_no: 'PUR-2025-004', date: '2025-05-24', supplier: 'Rahim Trading', warehouse: 'Main Warehouse', total: 15000, paid: 15000, due: 0, status: 'received' },
];

const statusColors = {
  received: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-blue-100 text-blue-700',
  returned: 'bg-red-100 text-red-500',
};

const PurchaseList = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filterOptions = [
    { value: 'All', label: t('purchase.list.filterAll') },
    { value: 'Received', label: t('purchase.list.filterReceived') },
    { value: 'Partial', label: t('purchase.list.filterPartial') },
    { value: 'Pending', label: t('purchase.list.filterPending') },
    { value: 'Returned', label: t('purchase.list.filterReturned') },
  ];

  const filtered = purchases.filter((p) => {
    const matchSearch = p.invoice_no.toLowerCase().includes(search.toLowerCase()) || p.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const totalPurchase = purchases.reduce((s, p) => s + p.total, 0);
  const totalPaid = purchases.reduce((s, p) => s + p.paid, 0);
  const totalDue = purchases.reduce((s, p) => s + p.due, 0);

  const summaryCards = [
    { labelKey: 'purchase.list.totalPurchase', value: `৳${totalPurchase.toLocaleString()}`, cls: 'text-[#26272F]' },
    { labelKey: 'purchase.list.totalPaid', value: `৳${totalPaid.toLocaleString()}`, cls: 'text-green-600' },
    { labelKey: 'purchase.list.totalDue', value: `৳${totalDue.toLocaleString()}`, cls: 'text-red-600' },
  ] as const;

  const tableHeaders = [
    t('purchase.list.colInvoiceNo'),
    t('common.date'),
    t('common.supplier'),
    t('common.warehouse'),
    t('common.total'),
    t('common.paid'),
    t('common.due'),
    t('common.status'),
    t('common.action'),
  ];

  return (
    <div>
      <PageHeader
        title={t('purchase.list.title')}
        subtitle={t('purchase.list.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.purchase') },
          { label: t('purchase.list.title') },
        ]}
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" /> {t('common.export')}
            </button>
            <Link to="/admin/purchase/add" className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
              <Plus className="h-4 w-4" /> {t('purchase.list.newPurchase')}
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((s) => (
          <div key={s.labelKey} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
            <p className="text-xs text-gray-500">{t(s.labelKey)}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('purchase.list.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
            {filterOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {tableHeaders.map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">{t('purchase.list.noPurchases')}</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[#ff6d29]">{item.invoice_no}</td>
                    <td className="px-4 py-3 text-gray-600">{item.date}</td>
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.supplier}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.warehouse}</td>
                    <td className="px-4 py-3 font-semibold">৳{item.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">৳{item.paid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-500 font-medium">৳{item.due.toLocaleString()}</td>
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

export default PurchaseList;
