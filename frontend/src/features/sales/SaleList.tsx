import { useState } from 'react';
import { Search, Eye, Plus, Download, Loader2, XCircle } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetAllSalesQuery, useCancelSaleMutation } from './salesApi';

const paymentColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-red-100 text-red-500',
};

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-200 text-gray-500',
};

const SaleList = () => {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetAllSalesQuery({ search, paymentStatus: paymentFilter || undefined, page, limit: 15 });
  const [cancelSale] = useCancelSaleMutation();

  const sales: any[] = data?.data?.data ?? [];
  const meta = data?.data?.meta;
  const totals = data?.data?.totals ?? { revenue: 0, profit: 0, due: 0 };

  const handleCancel = async (id: string, invoiceNo: string) => {
    if (!confirm(`Cancel sale ${invoiceNo}? This will reverse stock.`)) return;
    setCancellingId(id);
    try {
      await cancelSale(id).unwrap();
      toast.success('Sale cancelled');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Sale List"
        subtitle="View and manage all sales invoices"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Sales' }, { label: 'Sale List' }]}
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              <Download className="h-4 w-4" /> Export
            </button>
            <Link to="/admin/sales/add" className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
              <Plus className="h-4 w-4" /> New Sale
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: `৳${Number(totals.revenue).toLocaleString()}`, cls: 'text-[#26272F]' },
          { label: 'Total Profit', value: `৳${Number(totals.profit).toLocaleString()}`, cls: 'text-green-600' },
          { label: 'Total Due', value: `৳${Number(totals.due).toLocaleString()}`, cls: 'text-red-600' },
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
            <input type="text" placeholder="Search invoice or customer..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none">
            <option value="">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Invoice', 'Date', 'Customer', 'Total', 'Paid', 'Due', 'Profit', 'Payment', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading || isFetching ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" />
                </td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">No sales found</td></tr>
              ) : (
                sales.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[#ff6d29] whitespace-nowrap">{item.invoiceNo}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(item.saleDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.customer?.name ?? 'Walk-in'}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">৳{Number(item.grandTotal).toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600 whitespace-nowrap">৳{Number(item.paidAmount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-500 whitespace-nowrap">
                      {Number(item.dueAmount) > 0 ? `৳${Number(item.dueAmount).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-green-600 font-medium whitespace-nowrap">৳{Number(item.totalProfit).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${paymentColors[item.paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        {item.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(item.id, item.invoiceNo)}
                            disabled={cancellingId === item.id}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg disabled:opacity-40"
                            title="Cancel"
                          >
                            {cancellingId === item.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <XCircle className="h-4 w-4" />
                            }
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

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between">
            <span className="text-xs text-gray-500">{meta.totalItems} records — Page {meta.currentPage} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleList;
