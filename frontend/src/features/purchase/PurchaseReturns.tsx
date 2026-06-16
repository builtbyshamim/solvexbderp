import { useState } from 'react';
import { Search, Plus, CheckCircle2, RotateCcw } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { useGetPurchaseReturnsQuery, useApprovePurchaseReturnMutation } from './purchaseApi';
import CommonPagination from '../../components/ui/paginations/CommonPagination';

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-500',
};

const PurchaseReturns = () => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState({ page: 1, limit: 10 });
  const { data, isFetching, error } = useGetPurchaseReturnsQuery(searchValue);
  const [approveReturn, { isLoading: isApproving }] = useApprovePurchaseReturnMutation();

  const returns = data?.data || [];
  const meta = data?.meta || { totalItems: 0, totalPages: 1 };

  const handleApprove = async (id: string) => {
    try {
      await approveReturn(id).unwrap();
      toast.success('Return approved');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to approve');
    }
  };

  return (
    <div>
      <PageHeader
        title="Purchase Returns"
        subtitle="Manage purchase return requests"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.purchase'), path: '/admin/purchase/list' },
          { label: 'Returns' },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> New Return
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#26272F]">All Returns</h3>
          <span className="text-sm text-gray-500">{meta.totalItems} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Reference', 'Date', 'Purchase Invoice', 'Supplier', 'Total', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : (error || returns.length === 0) ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <RotateCcw className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  No purchase returns found
                </td></tr>
              ) : returns.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#ff6d29]">{item.referenceNo ?? item.id?.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.purchase?.invoiceNo ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{item.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold">৳{Number(item.totalAmount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.status === 'pending' && (
                      <button onClick={() => handleApprove(item.id)} disabled={isApproving}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50">
                        <CheckCircle2 className="h-3 w-3" /> Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default PurchaseReturns;
