import { useState, useEffect } from 'react';
import { Search, Plus, Loader2, CheckCircle, X } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import {
  useGetAllSaleReturnsQuery,
  useCreateSaleReturnMutation,
  useApproveReturnMutation,
  useGetAllSalesQuery,
  useGetSaleQuery,
} from './salesApi';

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-500',
};

// ── New Return Modal ──────────────────────────────────────────────────────────

interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  maxQty: number;
  selected: boolean;
}

const NewReturnModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useLanguage();
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [showSaleList, setShowSaleList] = useState(false);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [createReturn, { isLoading }] = useCreateSaleReturnMutation();

  const { data: salesData } = useGetAllSalesQuery(
    { search: invoiceSearch, limit: 10 },
    { skip: invoiceSearch.length < 2 },
  );
  const foundSales: any[] = salesData?.data ?? [];

  const { data: saleDetailData } = useGetSaleQuery(selectedSaleId, { skip: !selectedSaleId });
  const saleDetail = saleDetailData;

  useEffect(() => {
    if (saleDetail?.items) {
      setReturnItems(
        saleDetail.items.map((item: any) => ({
          productId: item.productId,
          productName: item.product?.name ?? item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          maxQty: item.quantity,
          selected: false,
        })),
      );
    }
  }, [saleDetail]);

  const toggleItem = (idx: number) => {
    setReturnItems((prev) => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  };

  const updateQty = (idx: number, qty: number) => {
    setReturnItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: Math.min(Math.max(1, qty), it.maxQty) } : it));
  };

  const handleSubmit = async () => {
    if (!selectedSaleId) { toast.error('Please select a sale invoice'); return; }
    const items = returnItems.filter((i) => i.selected).map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
    if (items.length === 0) { toast.error('Please select at least one item to return'); return; }
    if (!reason.trim()) { toast.error('Please enter a reason for return'); return; }

    try {
      await createReturn({ saleId: selectedSaleId, returnDate, items, reason }).unwrap();
      toast.success('Return request created successfully');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create return');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DBDFE9]">
          <h2 className="text-base font-semibold text-[#26272F]">{t('sales.returns.modalTitle')}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Invoice Search */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales.returns.saleInvoice')} *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('sales.returns.searchPlaceholder')}
                value={invoiceSearch}
                onChange={(e) => { setInvoiceSearch(e.target.value); setShowSaleList(true); setSelectedSaleId(''); }}
                className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:border-[#ff6d29]"
              />
              {showSaleList && foundSales.length > 0 && (
                <div className="absolute z-10 top-full left-0 mt-1 bg-white border border-[#DBDFE9] rounded-lg shadow-lg w-full max-h-44 overflow-y-auto">
                  {foundSales.map((sale: any) => (
                    <button
                      key={sale.id}
                      onMouseDown={() => {
                        setSelectedSaleId(sale.id);
                        setInvoiceSearch(sale.invoiceNo);
                        setShowSaleList(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-orange-50 text-sm border-b border-gray-50 last:border-0"
                    >
                      <span className="font-mono text-[#ff6d29] font-medium">{sale.invoiceNo}</span>
                      <span className="ml-3 text-gray-500">{sale.customer?.name ?? 'Walk-in'}</span>
                      <span className="ml-2 text-gray-400 text-xs">৳{Number(sale.grandTotal).toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sale Items */}
          {selectedSaleId && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">{t('sales.returns.selectItems')}</label>
              {!saleDetail ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#ff6d29]" />
                </div>
              ) : returnItems.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">{t('sales.returns.noItemsInSale')}</p>
              ) : (
                <div className="border border-[#DBDFE9] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-10"></th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{t('sales.returns.product')}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{t('sales.returns.unitPrice')}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{t('sales.returns.returnQty')}</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{t('sales.returns.max')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {returnItems.map((item, idx) => (
                        <tr key={item.productId} className={item.selected ? 'bg-orange-50' : ''}>
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={item.selected} onChange={() => toggleItem(idx)}
                              className="h-4 w-4 accent-[#ff6d29]" />
                          </td>
                          <td className="px-3 py-2 font-medium text-[#26272F]">{item.productName}</td>
                          <td className="px-3 py-2 text-gray-600">৳{item.unitPrice.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number" value={item.quantity} min={1} max={item.maxQty}
                              disabled={!item.selected}
                              onChange={(e) => updateQty(idx, Number(e.target.value))}
                              className="w-16 px-2 py-1 border border-[#DBDFE9] rounded text-xs text-center focus:outline-none focus:border-[#ff6d29] disabled:opacity-40"
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-400 text-xs">{item.maxQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Return Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales.returns.returnDate')} *</label>
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales.returns.reasonForReturn')} *</label>
            <textarea
              value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why the customer is returning..."
              rows={3}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#DBDFE9] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit} disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t('sales.returns.submitReturn')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const SaleReturns = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetAllSaleReturnsQuery({ search, page, limit: 15 });
  const [approveReturn] = useApproveReturnMutation();

  const returns: any[] = data?.data ?? [];
  const meta = data?.meta;

  const handleApprove = async (id: string, ref: string) => {
    if (!confirm(`Approve return ${ref}? This will restore stock.`)) return;
    setApprovingId(id);
    try {
      await approveReturn(id).unwrap();
      toast.success('Return approved — stock restored');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve return');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div>
      {showModal && <NewReturnModal onClose={() => setShowModal(false)} />}

      <PageHeader
        title={t('sales.returns.title')}
        subtitle={t('sales.returns.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.sales'), path: '/admin/sales/list' },
          { label: t('sales.returns.title') },
        ]}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]"
          >
            <Plus className="h-4 w-4" /> {t('sales.returns.newReturn')}
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" placeholder={t('sales.returns.searchPlaceholder')}
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {[
                  t('common.reference'),
                  t('common.date'),
                  t('sales.returns.colSaleInvoice'),
                  t('common.customer'),
                  t('sales.returns.colItems'),
                  t('common.total'),
                  t('sales.returns.colReason'),
                  t('common.status'),
                  t('common.actions'),
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" />
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">{t('sales.returns.noReturns')}</td>
                </tr>
              ) : (
                returns.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.referenceNo}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(item.returnDate ?? item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-[#ff6d29] font-mono text-xs">{item.sale?.invoiceNo}</td>
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.customer?.name ?? item.sale?.customer?.name ?? 'Walk-in'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.items?.length ?? 0}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">৳{Number(item.totalAmount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(item.id, item.referenceNo ?? item.id)}
                          disabled={approvingId === item.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-green-600 hover:bg-green-50 rounded-lg text-xs font-medium disabled:opacity-40"
                          title={t('sales.returns.approve')}
                        >
                          {approvingId === item.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <CheckCircle className="h-3.5 w-3.5" />}
                          {t('sales.returns.approve')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between">
            <span className="text-xs text-gray-500">{meta.totalItems} records — {t('common.page')} {meta.currentPage} {t('common.of')} {meta.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50">{t('common.prev')}</button>
              <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50">{t('common.next')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleReturns;
