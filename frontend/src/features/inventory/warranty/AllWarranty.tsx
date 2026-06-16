import { useState } from 'react';
import { Plus, Search, Trash2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';
import { useGetAllWarrantyQuery, useCreateWarrantyMutation, useUpdateWarrantyMutation, useDeleteWarrantyMutation } from './warrantyApi';
import CommonPagination from '../../../components/ui/paginations/CommonPagination';
import PageHeader from '../../../components/shared/PageHeader';
import { useLanguage } from '../../../context/LanguageContext';

const WARRANTY_TYPES = ['days', 'months', 'years', 'lifetime'];

const AllWarranty = () => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState({ search: '', limit: 10, page: 1 });
  const debouncedSearch = useDebounce(searchValue.search, 500);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'months', duration: '0', description: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isFetching, error, refetch } = useGetAllWarrantyQuery({ ...searchValue, search: debouncedSearch });
  const [createWarranty, { isLoading: isCreating }] = useCreateWarrantyMutation();
  const [updateWarranty, { isLoading: isUpdating }] = useUpdateWarrantyMutation();
  const [deleteWarranty, { isLoading: isDeleting }] = useDeleteWarrantyMutation();

  const warranties = data?.data || [];
  const meta = data?.meta || { totalItems: 0, totalPages: 1 };
  const isBusy = isFetching || isCreating || isUpdating || isDeleting;

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', type: 'months', duration: '0', description: '' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, type: item.type || 'months', duration: String(item.duration ?? 0), description: item.description || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Warranty name is required'); return; }
    const payload = { name: form.name, type: form.type, duration: Number(form.duration), description: form.description };
    try {
      if (editItem) {
        await updateWarranty({ id: editItem.id, data: payload }).unwrap();
        toast.success('Warranty updated');
      } else {
        await createWarranty(payload).unwrap();
        toast.success('Warranty added');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save warranty');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWarranty(id).unwrap();
      toast.success('Warranty deleted');
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete warranty');
    }
  };

  const durationLabel = (w: any) =>
    w.type === 'lifetime' ? t('inventory.warranties.lifetime') : w.duration ? `${w.duration} ${w.type}` : 'N/A';

  return (
    <div>
      <PageHeader
        title={t('inventory.warranties.title')}
        subtitle={t('inventory.warranties.subtitle')}
        breadcrumbs={[{ label: t('common.home'), path: '/admin' }, { label: t('nav.inventory'), path: '/admin/inventory/products' }, { label: t('inventory.warranties.title') }]}
        actions={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> {t('inventory.warranties.addWarranty')}
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('inventory.warranties.searchPlaceholder')} value={searchValue.search}
              onChange={(e) => setSearchValue({ ...searchValue, search: e.target.value, page: 1 })}
              disabled={isFetching}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <span className="text-sm text-gray-500">{meta.totalItems} {t('inventory.warranties.warrantiesCount')}</span>
        </div>

        {error ? (
          <div className="p-8 text-center text-red-500 text-sm">Failed to load warranties. <button onClick={refetch} className="underline">Retry</button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                  {['#', t('inventory.warranties.colWarrantyName'), t('inventory.warranties.colDuration'), t('common.status'), t('common.action')].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isFetching ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">{t('inventory.products.loading')}</td></tr>
                ) : warranties.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-16 text-center">
                    <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-gray-400">{t('inventory.warranties.noWarranties')}</p>
                    <button onClick={openAdd} className="mt-3 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">{t('inventory.warranties.addFirstWarranty')}</button>
                  </td></tr>
                ) : (
                  warranties.map((item: any, index: number) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{(searchValue.page - 1) * searchValue.limit + index + 1}</td>
                      <td className="px-4 py-3 font-medium text-[#26272F]">{item.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{durationLabel(item)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {item.isActive ? t('inventory.products.statusActive') : t('inventory.products.statusInactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(item)} disabled={isBusy}
                            className="px-3 py-1.5 text-xs border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">{t('common.edit')}</button>
                          <button onClick={() => setDeleteId(item.id)} disabled={isBusy}
                            className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">{t('common.delete')}</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {warranties.length > 0 && (
          <div className="p-4 border-t border-[#DBDFE9]">
            <CommonPagination
              total={meta.totalItems}
              totalPage={meta.totalPages}
              setSearchValue={setSearchValue}
              searchValue={searchValue}
              refetch={refetch}
              limit={searchValue.limit}
              page={searchValue.page}
              disabled={isBusy}
            />
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">{editItem ? t('inventory.warranties.editTitle') : t('inventory.warranties.addTitle')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.warranties.warrantyName')} <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 1 Year Warranty"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.warranties.duration')}</label>
                  <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} min="0"
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.warranties.type')}</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                    {WARRANTY_TYPES.map((wt) => (
                      <option key={wt} value={wt}>{wt.charAt(0).toUpperCase() + wt.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.warranties.description')}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleSave} disabled={isBusy}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50">
                {isCreating || isUpdating ? t('common.saving') : editItem ? t('common.update') : t('inventory.warranties.addWarranty')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-[#26272F] mb-2">{t('inventory.warranties.deleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-6">{t('common.deleteWarning')}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={() => handleDelete(deleteId)} disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? t('common.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllWarranty;
