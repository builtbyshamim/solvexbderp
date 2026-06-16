import { useMemo, useState } from 'react';
import { Plus, Search, TrendingUp, TrendingDown, ChevronDown, AlertCircle, PackageSearch, MapPin } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../context/LanguageContext';
import { useGetAdjustmentsQuery, useCreateAdjustmentMutation } from './stockApi';
import { useGetAllProductsQuery } from '../products/productApi';
import { useGetStockLocationsQuery } from './stockLocationApi';
import CommonPagination from '../../../components/ui/paginations/CommonPagination';

const FORM_DEFAULT = {
  productId: '',
  productLabel: '',
  type: 'add',
  quantity: '',
  reason: '',
  note: '',
};

const StockAdjustment = () => {
  const { t } = useLanguage();
  const [paginate, setPaginate] = useState({ page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_DEFAULT);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);

  const { data: adjData, isFetching } = useGetAdjustmentsQuery({ page: paginate.page, limit: paginate.limit });
  const { data: locData } = useGetStockLocationsQuery(undefined);
  const { data: productData } = useGetAllProductsQuery({ limit: 500 });
  const [createAdjustment, { isLoading: isSaving }] = useCreateAdjustmentMutation();

  const adjustments = adjData?.data || [];
  const meta = adjData?.meta || { totalItems: 0, totalPages: 1 };
  const locations: any[] = Array.isArray(locData) ? locData : locData?.data || [];
  const allProducts: any[] = productData?.data || [];

  // Business-default location (isDefault=true, type='business')
  const defaultLocation = locations.find((l: any) => l.isDefault) ?? locations[0];

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

  const filteredAdj = adjustments.filter((a: any) => {
    const prod = productMap[a.productId];
    return `${prod?.name ?? ''} ${prod?.sku ?? ''}`.toLowerCase().includes(search.toLowerCase());
  });

  const totalAdditions = adjustments.filter((a: any) => a.type === 'add').reduce((s: number, a: any) => s + Number(a.quantity), 0);
  const totalDeductions = adjustments.filter((a: any) => a.type !== 'add').reduce((s: number, a: any) => s + Number(a.quantity), 0);

  const handleSave = async () => {
    if (!form.productId) { toast.error('Please select a product'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { toast.error('Enter a valid quantity'); return; }

    try {
      // warehouseId is NOT sent — backend auto-uses business-default location
      await createAdjustment({
        productId: form.productId,
        type: form.type,
        quantity: Number(form.quantity),
        reason: form.reason || undefined,
        note: form.note || undefined,
      }).unwrap();
      toast.success('Stock adjustment saved');
      setShowModal(false);
      setForm(FORM_DEFAULT);
      setProductSearch('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save adjustment');
    }
  };

  return (
    <div>
      <PageHeader
        title={t('inventory.stockAdj.title')}
        subtitle={t('inventory.stockAdj.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.inventory'), path: '/admin/inventory/products' },
          { label: t('inventory.stockAdj.title') },
        ]}
        actions={
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> {t('inventory.stockAdj.newAdjustment')}
          </button>
        }
      />

      {/* Default location banner */}
      {defaultLocation && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>All adjustments go to: <strong>{defaultLocation.name}</strong>
            {defaultLocation.type === 'business' && ' (Business Default)'}
          </span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-green-600 font-medium">{t('inventory.stockAdj.totalAdditions')}</p>
            <p className="text-xl font-bold text-green-700">+{totalAdditions}</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-red-500 font-medium">{t('inventory.stockAdj.totalDeductions')}</p>
            <p className="text-xl font-bold text-red-600">-{totalDeductions}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('inventory.stockAdj.searchPlaceholder')} value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <span className="text-sm text-gray-500">{meta.totalItems} {t('common.records')}</span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Date', 'Product', 'Location', 'Type', 'Qty', 'Balance', 'Reason'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : filteredAdj.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <PackageSearch className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  {t('inventory.stockAdj.noAdjustments')}
                </td></tr>
              ) : filteredAdj.map((item: any) => {
                const prod = productMap[item.productId];
                const isIn = item.type === 'add';
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#26272F]">{prod?.name ?? '—'}</div>
                      <div className="text-xs text-gray-400 font-mono">{prod?.sku ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{locationMap[item.locationId] ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${isIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {isIn ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={isIn ? 'text-green-600' : 'text-red-500'}>{isIn ? '+' : '-'}{Number(item.quantity)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {Number(item.balanceBefore)} → <span className="font-semibold text-[#26272F]">{Number(item.balanceAfter)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{item.reason || item.note || '—'}</td>
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
          ) : filteredAdj.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <PackageSearch className="h-10 w-10 mx-auto mb-2 text-gray-300" />{t('inventory.stockAdj.noAdjustments')}
            </div>
          ) : filteredAdj.map((item: any) => {
            const prod = productMap[item.productId];
            const isIn = item.type === 'add';
            return (
              <div key={item.id} className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#26272F] truncate">{prod?.name ?? '—'}</div>
                  <div className="text-xs text-gray-400 font-mono">{prod?.sku ?? ''}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{locationMap[item.locationId] ?? '—'} · {new Date(item.createdAt).toLocaleDateString()}</div>
                  {(item.reason || item.note) && <div className="text-xs text-gray-400 mt-1 truncate">{item.reason || item.note}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-bold ${isIn ? 'text-green-600' : 'text-red-500'}`}>{isIn ? '+' : '-'}{Number(item.quantity)}</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {item.type}
                  </span>
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
            <h2 className="text-lg font-semibold text-[#26272F] mb-1">{t('inventory.stockAdj.modalTitle')}</h2>

            {/* Location info — read-only */}
            <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-[#DBDFE9] rounded-lg text-sm">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500 text-xs">Location:</span>
              <span className="font-medium text-[#26272F] text-xs">
                {defaultLocation?.name ?? 'Business Default'}
              </span>
              {defaultLocation?.type === 'business' && (
                <span className="ml-auto text-xs text-[#ff6d29]">★ Default</span>
              )}
            </div>

            <div className="space-y-4">
              {/* Product search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('inventory.stockAdj.productName')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button type="button" onClick={() => setShowProductDrop((v) => !v)}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
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
                        {filteredProducts.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-gray-400 text-center">No products found</div>
                        ) : filteredProducts.slice(0, 50).map((p: any) => (
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

              {/* Type + Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.stockAdj.adjustmentType')}</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                    <option value="add">Add (+)</option>
                    <option value="remove">Remove (-)</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inventory.stockAdj.quantity')} <span className="text-red-500">*</span>
                  </label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    min="0.0001" step="any" placeholder="0"
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.stockAdj.reason')}</label>
                <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Damaged goods, Opening correction..."
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>

              {form.type !== 'add' && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  Deduction will fail if quantity exceeds available stock.
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => { setShowModal(false); setForm(FORM_DEFAULT); setProductSearch(''); }}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                {t('common.cancel')}
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {t('inventory.stockAdj.saveAdjustment')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdjustment;
