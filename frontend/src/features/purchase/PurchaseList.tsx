import { useState } from 'react';
import { Search, Eye, Plus, Download } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useGetAllPurchasesQuery } from './purchaseApi';
import CommonPagination from '../../components/ui/paginations/CommonPagination';
import { useDebounce } from '../../hooks/useDebounce';

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-blue-100 text-blue-700',
  returned: 'bg-red-100 text-red-500',
  cancelled: 'bg-gray-100 text-gray-500',
};

const PurchaseList = () => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState({ search: '', limit: 10, page: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(searchValue.search, 500);

  const { data, isFetching } = useGetAllPurchasesQuery({
    ...searchValue,
    search: debouncedSearch,
    ...(statusFilter && { status: statusFilter }),
  });

  const purchases = data?.data || [];
  const meta = data?.meta || { totalItems: 0, totalPages: 1 };

  const totalPurchase = purchases.reduce((s: number, p: any) => s + Number(p.grandTotal ?? 0), 0);
  const totalPaid = purchases.reduce((s: number, p: any) => s + Number(p.paidAmount ?? 0), 0);
  const totalDue = purchases.reduce((s: number, p: any) => s + Number(p.dueAmount ?? 0), 0);

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
            <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              <Download className="h-4 w-4" /> {t('common.export')}
            </button>
            <Link to="/admin/purchase/add"
              className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
              <Plus className="h-4 w-4" /> {t('purchase.list.newPurchase')}
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('purchase.list.totalPurchase')}</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">৳{totalPurchase.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('purchase.list.totalPaid')}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">৳{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('purchase.list.totalDue')}</p>
          <p className="text-2xl font-bold text-red-600 mt-1">৳{totalDue.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('purchase.list.searchPlaceholder')}
              value={searchValue.search}
              onChange={(e) => setSearchValue({ ...searchValue, search: e.target.value, page: 1 })}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSearchValue((v) => ({ ...v, page: 1 })); }}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
            <option value="">{t('purchase.list.filterAll')}</option>
            <option value="confirmed">{t('purchase.list.filterReceived')}</option>
            <option value="partial">{t('purchase.list.filterPartial')}</option>
            <option value="pending">{t('purchase.list.filterPending')}</option>
            <option value="cancelled">{t('purchase.list.filterReturned')}</option>
          </select>
          <span className="text-sm text-gray-500 self-center">{meta.totalItems} records</span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {[t('purchase.list.colInvoiceNo'), t('common.date'), t('common.supplier'), t('common.total'), t('common.paid'), t('common.due'), t('common.status'), t('common.action')]
                  .map((h) => <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">{t('purchase.list.noPurchases')}</td></tr>
              ) : purchases.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-[#ff6d29]">{item.invoiceNo}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(item.purchaseDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{item.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold">৳{Number(item.grandTotal).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">৳{Number(item.paidAmount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500 font-medium">৳{Number(item.dueAmount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {item.paymentStatus ?? item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View"><Eye className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {isFetching ? (
            <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
          ) : purchases.map((item: any) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between mb-1">
                <span className="font-mono text-xs text-[#ff6d29] font-medium">{item.invoiceNo}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[item.status] ?? 'bg-gray-100 text-gray-500'}`}>{item.paymentStatus}</span>
              </div>
              <div className="text-sm font-medium text-[#26272F]">{item.supplier?.name ?? '—'}</div>
              <div className="text-xs text-gray-400 mb-2">{new Date(item.purchaseDate).toLocaleDateString()}</div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-700">৳{Number(item.grandTotal).toLocaleString()}</span>
                <span className="text-green-600">Paid: ৳{Number(item.paidAmount).toLocaleString()}</span>
                {Number(item.dueAmount) > 0 && <span className="text-red-500">Due: ৳{Number(item.dueAmount).toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>

        {meta.totalPages > 1 && (
          <CommonPagination total={meta.totalItems} totalPage={meta.totalPages}
            setSearchValue={setSearchValue} searchValue={searchValue}
            limit={searchValue.limit} page={searchValue.page} />
        )}
      </div>
    </div>
  );
};

export default PurchaseList;
