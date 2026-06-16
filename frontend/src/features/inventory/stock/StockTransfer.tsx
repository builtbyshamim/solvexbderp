import { useMemo, useState } from 'react';
import { Plus, Search, ArrowRightLeft, CheckCircle2, XCircle, Clock, ChevronDown } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../context/LanguageContext';
import { useGetTransfersQuery, useCreateTransferMutation, useApproveTransferMutation, useCancelTransferMutation } from './stockApi';
import { useGetAllProductsQuery } from '../products/productApi';
import { useGetStockLocationsQuery } from './stockLocationApi';
import CommonPagination from '../../../components/ui/paginations/CommonPagination';

const FORM_DEFAULT = {
  productId: '',
  productLabel: '',
  fromLocationId: '',
  toLocationId: '',
  quantity: '',
  note: '',
};

const statusConfig: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
  approved:  { cls: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="h-3 w-3" />, label: 'Approved' },
  cancelled: { cls: 'bg-red-100 text-red-500',      icon: <XCircle className="h-3 w-3" />, label: 'Cancelled' },
};

const StockTransfer = () => {
  const { t } = useLanguage();
  const [paginate, setPaginate] = useState({ page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_DEFAULT);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);

  const { data: trfData, isFetching } = useGetTransfersQuery({ page: paginate.page, limit: paginate.limit });
  const { data: locData } = useGetStockLocationsQuery(undefined);
  const { data: productData } = useGetAllProductsQuery({ limit: 500 });
  const [createTransfer, { isLoading: isSaving }] = useCreateTransferMutation();
  const [approveTransfer, { isLoading: isApproving }] = useApproveTransferMutation();
  const [cancelTransfer, { isLoading: isCancelling }] = useCancelTransferMutation();

  const transfers = trfData?.data || [];
  const meta = trfData?.meta || { totalItems: 0, totalPages: 1 };
  const locations: any[] = Array.isArray(locData) ? locData : locData?.data || [];
  const allProducts: any[] = productData?.data || [];

  const locationMap = useMemo(
    () => Object.fromEntries(locations.map((l: any) => [l.id, l.name])),
    [locations],
  );
  const productMap = useMemo(
    () => Object.fromEntries(allProducts.map((p: any) => [p.id, { name: p.name, sku: p.sku }])),
    [allProducts],
  );
  const filteredProducts = useMemo(
    () => allProducts.filter((p: any) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(productSearch.toLowerCase()),
    ),
    [allProducts, productSearch],
  );

  const filteredTrf = transfers.filter((tr: any) => {
    const prod = productMap[tr.productId];
    return `${prod?.name ?? ''} ${prod?.sku ?? ''}`.toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    pending:   transfers.filter((t: any) => t.status === 'pending').length,
    approved:  transfers.filter((t: any) => t.status === 'approved').length,
    cancelled: transfers.filter((t: any) => t.status === 'cancelled').length,
  };

  const handleSave = async () => {
    if (!form.productId) { toast.error('Please select a product'); return; }
    if (!form.fromLocationId || !form.toLocationId) { toast.error('Please select source and destination'); return; }
    if (form.fromLocationId === form.toLocationId) { toast.error('Source and destination must be different'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { toast.error('Enter a valid quantity'); return; }

    try {
      await createTransfer({
        productId: form.productId,
        fromLocationId: form.fromLocationId,
        toLocationId: form.toLocationId,
        quantity: Number(form.quantity),
        note: form.note || undefined,
      }).unwrap();
      toast.success('Transfer created — pending approval');
      setShowModal(false);
      setForm(FORM_DEFAULT);
      setProductSearch('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create transfer');
    }
  };

  const handleApprove = async (id: string) => {
    try { await approveTransfer(id).unwrap(); toast.success('Transfer approved'); }
    catch (err: any) { toast.error(err?.data?.message || 'Failed to approve'); }
  };
  const handleCancel = async (id: string) => {
    try { await cancelTransfer(id).unwrap(); toast.success('Transfer cancelled'); }
    catch (err: any) { toast.error(err?.data?.message || 'Failed to cancel'); }
  };

  const LocationSelect = ({ value, onChange, exclude }: { value: string; onChange: (v: string) => void; exclude?: string }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
      <option value="">Select location...</option>
      {locations.filter((l: any) => l.id !== exclude).map((l: any) => (
        <option key={l.id} value={l.id}>
          {l.name}{l.isDefault ? ' ★' : ''}
        </option>
      ))}
    </select>
  );

  return (
    <div>
      <PageHeader
        title={t('inventory.stockTrf.title')}
        subtitle={t('inventory.stockTrf.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.inventory'), path: '/admin/inventory/products' },
          { label: t('inventory.stockTrf.title') },
        ]}
        actions={
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> {t('inventory.stockTrf.newTransfer')}
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { key: 'pending', label: 'Pending', cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { key: 'approved', label: 'Approved', cls: 'bg-green-50 border-green-200 text-green-700' },
          { key: 'cancelled', label: 'Cancelled', cls: 'bg-red-50 border-red-200 text-red-600' },
        ].map((s) => (
          <div key={s.key} className={`border rounded-lg p-3 text-center ${s.cls}`}>
            <div className="text-xl font-bold">{stats[s.key as keyof typeof stats]}</div>
            <div className="text-xs font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('inventory.stockTrf.searchPlaceholder')} value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <span className="text-sm text-gray-500">{meta.totalItems} {t('inventory.stockTrf.transfersCount')}</span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Date', 'Product', 'From → To', 'Qty', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : filteredTrf.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  <ArrowRightLeft className="h-10 w-10 mx-auto mb-2 text-gray-300" />{t('inventory.stockTrf.noTransfers')}
                </td></tr>
              ) : filteredTrf.map((item: any) => {
                const prod = productMap[item.productId];
                const sc = statusConfig[item.status] ?? statusConfig.pending;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#26272F]">{prod?.name ?? '—'}</div>
                      <div className="text-xs text-gray-400 font-mono">{prod?.sku ?? ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <span className="truncate max-w-[90px]">{locationMap[item.fromLocationId] ?? '—'}</span>
                        <ArrowRightLeft className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[90px]">{locationMap[item.toLocationId] ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#26272F]">{Number(item.quantity)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.cls}`}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleApprove(item.id)} disabled={isApproving || isCancelling}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50">
                            <CheckCircle2 className="h-3 w-3" /> {t('inventory.stockTrf.approve')}
                          </button>
                          <button onClick={() => handleCancel(item.id)} disabled={isApproving || isCancelling}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50">
                            <XCircle className="h-3 w-3" /> {t('inventory.stockTrf.cancel')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {isFetching ? (
            <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredTrf.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <ArrowRightLeft className="h-10 w-10 mx-auto mb-2 text-gray-300" />{t('inventory.stockTrf.noTransfers')}
            </div>
          ) : filteredTrf.map((item: any) => {
            const prod = productMap[item.productId];
            const sc = statusConfig[item.status] ?? statusConfig.pending;
            return (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-[#26272F]">{prod?.name ?? '—'}</div>
                    <div className="text-xs text-gray-400 font-mono">{prod?.sku ?? ''}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${sc.cls}`}>
                    {sc.icon} {sc.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span className="truncate">{locationMap[item.fromLocationId] ?? '—'}</span>
                  <ArrowRightLeft className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{locationMap[item.toLocationId] ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Qty: <span className="font-semibold text-[#26272F]">{Number(item.quantity)}</span>
                    <span className="ml-2 text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </span>
                  {item.status === 'pending' && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleApprove(item.id)} disabled={isApproving || isCancelling}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded disabled:opacity-50">
                        <CheckCircle2 className="h-3 w-3" /> Approve
                      </button>
                      <button onClick={() => handleCancel(item.id)} disabled={isApproving || isCancelling}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded disabled:opacity-50">
                        <XCircle className="h-3 w-3" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {meta.totalPages > 1 && (
          <CommonPagination total={meta.totalItems} totalPage={meta.totalPages}
            setSearchValue={setPaginate} searchValue={paginate} limit={paginate.limit} page={paginate.page} />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">{t('inventory.stockTrf.modalTitle')}</h2>
            <div className="space-y-4">
              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('inventory.stockTrf.productName')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button type="button" onClick={() => setShowProductDrop((v) => !v)}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm text-left flex items-center justify-between">
                    <span className={form.productLabel ? 'text-[#26272F]' : 'text-gray-400'}>{form.productLabel || 'Select product...'}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                  {showProductDrop && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-[#DBDFE9] rounded-lg shadow-lg">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <input autoFocus type="text" placeholder="Search..." value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#ff6d29]" />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredProducts.slice(0, 50).map((p: any) => (
                          <button key={p.id} type="button"
                            onClick={() => { setForm((f) => ({ ...f, productId: p.id, productLabel: `${p.name} (${p.sku || ''})` })); setShowProductDrop(false); setProductSearch(''); }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between">
                            <span className="text-sm text-[#26272F]">{p.name}</span>
                            <span className="text-xs text-gray-400 font-mono">{p.sku}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* From / To Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.stockTrf.fromWarehouse')} <span className="text-red-500">*</span>
                  </label>
                  <LocationSelect value={form.fromLocationId}
                    onChange={(v) => setForm({ ...form, fromLocationId: v })}
                    exclude={form.toLocationId} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.stockTrf.toWarehouse')} <span className="text-red-500">*</span>
                  </label>
                  <LocationSelect value={form.toLocationId}
                    onChange={(v) => setForm({ ...form, toLocationId: v })}
                    exclude={form.fromLocationId} />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('inventory.stockTrf.quantity')} <span className="text-red-500">*</span>
                </label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  min="0.0001" step="any" placeholder="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.stockTrf.note')}</label>
                <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2}
                  placeholder="Optional note..."
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => { setShowModal(false); setForm(FORM_DEFAULT); setProductSearch(''); }}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                {t('common.cancel')}
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {t('inventory.stockTrf.createTransfer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransfer;
