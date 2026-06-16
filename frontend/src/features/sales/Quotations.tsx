import { useState, useRef, useEffect } from 'react';
import { Search, Plus, ArrowRight, Loader2, X, Trash2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import {
  useGetAllQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationStatusMutation,
  useConvertQuotationMutation,
} from './salesApi';
import { useGetAllCustomersQuery } from './salesApi';
import { useGetAllProductsQuery } from '../inventory/products/productApi';
import { useActiveWarehouse } from '../../hooks/useActiveWarehouse';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-500',
  converted: 'bg-purple-100 text-purple-700',
};

// ── Product Search (inline) ───────────────────────────────────────────────────

const ProductSearch = ({ value, warehouseId, onSelect }: {
  value: string;
  warehouseId: string;
  onSelect: (p: { id: string; name: string; sellingPrice: number }) => void;
}) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useGetAllProductsQuery({ search: query, limit: 10 }, { skip: query.length < 1 });
  const products: any[] = data?.data ?? [];

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input
        type="text" value={query} placeholder="Search product..."
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29] min-w-[160px]"
      />
      {open && products.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-[#DBDFE9] rounded-lg shadow-lg w-64 max-h-44 overflow-y-auto">
          {products.map((p: any) => (
            <button
              key={p.id}
              onMouseDown={() => {
                onSelect({ id: p.id, name: p.name, sellingPrice: Number(p.sellingPrice) });
                setQuery(p.name);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm border-b border-gray-50 last:border-0"
            >
              <div className="font-medium text-[#26272F]">{p.name}</div>
              <div className="flex items-center justify-between text-xs mt-0.5">
                <span className="text-gray-400">{p.sku}</span>
                <span className="text-[#ff6d29] font-semibold">৳{Number(p.sellingPrice).toLocaleString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── New Quotation Modal ───────────────────────────────────────────────────────

interface QuoteItem {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  total: number;
}

const NewQuotationModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useLanguage();
  const [customerId, setCustomerId] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([
    { id: 1, productId: '', productName: '', quantity: 1, unitPrice: 0, discountAmount: 0, total: 0 },
  ]);

  const { data: customersData } = useGetAllCustomersQuery({ limit: 200 });
  const customers: any[] = customersData?.data ?? [];
  const [createQuotation, { isLoading }] = useCreateQuotationMutation();

  const updateItem = (id: number, patch: Partial<QuoteItem>) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== id) return it;
      const u = { ...it, ...patch };
      u.total = u.quantity * u.unitPrice - u.discountAmount;
      return u;
    }));
  };

  const grandTotal = items.reduce((s, i) => s + i.total, 0);

  const handleSubmit = async () => {
    const invalidItems = items.filter((i) => !i.productId || i.quantity <= 0);
    if (invalidItems.length > 0) { toast.error('Please fill all product rows'); return; }

    try {
      await createQuotation({
        customerId: customerId || undefined,
        quotationDate,
        validUntil: validUntil || undefined,
        note: note || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountAmount: i.discountAmount || 0,
        })),
      }).unwrap();
      toast.success('Quotation created successfully');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create quotation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DBDFE9]">
          <h2 className="text-base font-semibold text-[#26272F]">{t('sales.quotations.newQuotation')}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales.quotations.customer')}</label>
              <select
                value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
              >
                <option value="">{t('sales.quotations.walkIn')}</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales.quotations.quotationDate')}</label>
              <input
                type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales.quotations.validUntil')}</label>
              <input
                type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales.quotations.note')}</label>
              <input
                type="text" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note..."
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-600">{t('sales.quotations.items')}</label>
              <button
                onClick={() => setItems((prev) => [...prev, { id: Date.now(), productId: '', productName: '', quantity: 1, unitPrice: 0, discountAmount: 0, total: 0 }])}
                className="text-xs text-[#ff6d29] font-medium flex items-center gap-1 hover:text-[#e65a1f]"
              >
                <Plus className="h-3.5 w-3.5" /> {t('sales.quotations.addRow')}
              </button>
            </div>
            <div className="border border-[#DBDFE9] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                    {['Product', 'Qty', 'Unit Price', 'Disc (৳)', 'Total', ''].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-2">
                        <ProductSearch
                          value={item.productName}
                          warehouseId=""
                          onSelect={(p) => updateItem(item.id, { productId: p.id, productName: p.name, unitPrice: p.sellingPrice })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.quantity} min={1}
                          onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                          className="w-14 px-2 py-1 border border-[#DBDFE9] rounded text-xs text-center focus:outline-none focus:border-[#ff6d29]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.unitPrice} min={0}
                          onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                          className="w-24 px-2 py-1 border border-[#DBDFE9] rounded text-xs focus:outline-none focus:border-[#ff6d29]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.discountAmount} min={0}
                          onChange={(e) => updateItem(item.id, { discountAmount: Number(e.target.value) })}
                          className="w-18 px-2 py-1 border border-[#DBDFE9] rounded text-xs focus:outline-none focus:border-[#ff6d29]"
                        />
                      </td>
                      <td className="px-3 py-2 font-semibold text-[#26272F] whitespace-nowrap">৳{item.total.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <button
                          disabled={items.length === 1}
                          onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                          className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-2 text-sm font-bold text-[#26272F]">
              {t('sales.quotations.grandTotal')}: ৳{grandTotal.toLocaleString()}
            </div>
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
            {t('sales.quotations.createQuotation')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Convert to Sale Modal ─────────────────────────────────────────────────────

const ConvertModal = ({ quotation, onClose }: { quotation: any; onClose: () => void }) => {
  const { t } = useLanguage();
  const { warehouseId: activeWarehouseId, warehouses, hasWarehouses } = useActiveWarehouse();
  const [warehouseId, setWarehouseId] = useState(activeWarehouseId ?? '');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidAmount, setPaidAmount] = useState(String(quotation.grandTotal ?? 0));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [convert, { isLoading }] = useConvertQuotationMutation();

  useEffect(() => {
    if (activeWarehouseId && !warehouseId) setWarehouseId(activeWarehouseId);
  }, [activeWarehouseId]);

  const handleConvert = async () => {
    if (!warehouseId) { toast.error('Select a warehouse'); return; }
    try {
      await convert({
        id: quotation.id,
        data: { warehouseId, saleDate, paidAmount: Number(paidAmount), paymentMethod },
      }).unwrap();
      toast.success('Quotation converted to sale successfully');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to convert quotation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DBDFE9]">
          <h2 className="text-base font-semibold text-[#26272F]">{t('sales.quotations.convertTitle')}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Converting quotation <span className="font-mono text-[#ff6d29] font-semibold">{quotation.referenceNo}</span> to a sale invoice.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales.quotations.saleDate')} *</label>
            <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]" />
          </div>
          {hasWarehouses && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {t('sales.quotations.warehouse')} {warehouses.length > 1 && '*'}
              </label>
              {warehouses.length === 1 ? (
                <div className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm text-gray-600 bg-gray-50">
                  {warehouses[0].name}
                </div>
              ) : (
                <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]">
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}{w.isDefault ? ' ★' : ''}</option>)}
                </select>
              )}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales.quotations.paymentMethod')}</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile_banking">Mobile Banking</option>
              <option value="credit">Credit (Due)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Paid Amount (৳) — Total: ৳{Number(quotation.grandTotal).toLocaleString()}
            </label>
            <input
              type="number" value={paidAmount} min={0}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#DBDFE9] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConvert} disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {t('sales.quotations.convertTitle')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const Quotations = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [convertQuotation, setConvertQuotation] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetAllQuotationsQuery({ search, page, limit: 15 });
  const [updateStatus] = useUpdateQuotationStatusMutation();

  const quotations: any[] = data?.data ?? [];
  const meta = data?.meta;

  const handleStatusChange = async (id: string, status: string, ref: string) => {
    setUpdatingId(id);
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Quotation marked as ${status}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {showCreateModal && <NewQuotationModal onClose={() => setShowCreateModal(false)} />}
      {convertQuotation && <ConvertModal quotation={convertQuotation} onClose={() => setConvertQuotation(null)} />}

      <PageHeader
        title={t('sales.quotations.title')}
        subtitle={t('sales.quotations.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.sales'), path: '/admin/sales/list' },
          { label: t('sales.quotations.title') },
        ]}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]"
          >
            <Plus className="h-4 w-4" /> {t('sales.quotations.newQuotation')}
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" placeholder={t('sales.quotations.searchPlaceholder')}
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {[t('sales.quotations.colReference'), t('common.date'), t('sales.quotations.colValidUntil'), t('common.customer'), t('sales.quotations.colItems'), t('common.total'), t('common.status'), t('common.actions')].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" />
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">{t('sales.quotations.noQuotations')}</td>
                </tr>
              ) : (
                quotations.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[#ff6d29]">{item.referenceNo}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(item.quotationDate ?? item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {item.validUntil ? new Date(item.validUntil).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#26272F]">{item.customer?.name ?? 'Walk-in'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.items?.length ?? 0}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">৳{Number(item.grandTotal).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {item.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'sent', item.quotationNo)}
                            disabled={updatingId === item.id}
                            className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium disabled:opacity-40"
                          >
                            {t('sales.quotations.markSent')}
                          </button>
                        )}
                        {item.status === 'sent' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(item.id, 'accepted', item.quotationNo)}
                              disabled={updatingId === item.id}
                              className="px-2.5 py-1 text-xs text-green-600 hover:bg-green-50 rounded-lg font-medium disabled:opacity-40"
                            >
                              {t('sales.quotations.accept')}
                            </button>
                            <button
                              onClick={() => handleStatusChange(item.id, 'rejected', item.quotationNo)}
                              disabled={updatingId === item.id}
                              className="px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg font-medium disabled:opacity-40"
                            >
                              {t('sales.quotations.reject')}
                            </button>
                          </>
                        )}
                        {item.status === 'accepted' && (
                          <button
                            onClick={() => setConvertQuotation(item)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded-lg font-medium"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                            {t('sales.quotations.convert')}
                          </button>
                        )}
                        {updatingId === item.id && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
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
            <span className="text-xs text-gray-500">{meta.totalItems} {t('common.records')} — {t('common.page')} {meta.currentPage} {t('common.of')} {meta.totalPages}</span>
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

export default Quotations;
