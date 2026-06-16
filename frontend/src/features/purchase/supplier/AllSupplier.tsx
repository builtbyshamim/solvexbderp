import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Phone, Mail, Loader2, Eye } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../context/LanguageContext';
import {
  useGetAllSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from '../purchaseApi';

const emptyForm = { name: '', company: '', phone: '', email: '', address: '', openingBalance: '' };

const AllSupplier = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useGetAllSuppliersQuery({
    search: debouncedSearch,
    page,
    limit: 15,
  });
  const [createSupplier, { isLoading: creating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updating }] = useUpdateSupplierMutation();
  const [deleteSupplier, { isLoading: deleting }] = useDeleteSupplierMutation();

  const suppliers = data?.data ?? [];
  const meta = data?.meta;

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name,
      company: item.company ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      address: item.address ?? '',
      openingBalance: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    try {
      if (editItem) {
        await updateSupplier({
          id: editItem.id,
          data: {
            name: form.name,
            company: form.company,
            phone: form.phone,
            email: form.email,
            address: form.address,
          },
        }).unwrap();
        toast.success('Supplier updated');
      } else {
        await createSupplier({
          name: form.name,
          company: form.company,
          phone: form.phone,
          email: form.email,
          address: form.address,
          openingBalance: form.openingBalance ? Number(form.openingBalance) : 0,
        }).unwrap();
        toast.success('Supplier added');
      }
      setShowModal(false);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to save supplier');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteSupplier(deleteItem.id).unwrap();
      toast.success('Supplier deleted');
      setDeleteItem(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to delete supplier');
    }
  };

  const totalPayable = suppliers
    .filter((s: any) => Number(s.currentBalance) > 0)
    .reduce((sum: number, s: any) => sum + Number(s.currentBalance), 0);

  return (
    <div>
      <PageHeader
        title={t('purchase.suppliers.title')}
        subtitle={t('purchase.suppliers.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.purchase'), path: '/admin/purchase/list' },
          { label: t('purchase.suppliers.title') },
        ]}
        actions={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
          >
            <Plus className="h-4 w-4" /> {t('purchase.suppliers.addSupplier')}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('purchase.suppliers.totalSuppliers')}</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">{meta?.totalItems ?? 0}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('purchase.suppliers.activeSuppliers')}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{suppliers.length}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('purchase.suppliers.totalPayable')}</p>
          <p className="text-2xl font-bold text-red-600 mt-1">৳{totalPayable.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('purchase.suppliers.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
          <span className="text-sm text-gray-500">
            {isFetching
              ? t('inventory.products.loading')
              : `${meta?.totalItems ?? 0} ${t('purchase.suppliers.suppliersCount')}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {[
                  '#',
                  t('common.supplier'),
                  t('purchase.suppliers.colContact'),
                  t('purchase.suppliers.colAddress'),
                  t('purchase.suppliers.colBalance'),
                  t('common.actions'),
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" />
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {t('purchase.suppliers.noSuppliers')}
                  </td>
                </tr>
              ) : (
                suppliers.map((item: any, index: number) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{(page - 1) * 15 + index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#26272F]">{item.name}</div>
                      {item.company && <div className="text-xs text-gray-400">{item.company}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {item.phone && (
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <Phone className="h-3 w-3" />
                          {item.phone}
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5">
                          <Mail className="h-3 w-3" />
                          {item.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.address || '—'}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span
                        className={
                          Number(item.currentBalance) > 0 ? 'text-red-600' : 'text-gray-500'
                        }
                      >
                        ৳{Number(item.currentBalance).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/purchase/suppliers/${item.id}`} className="p-1.5 text-[#ff6d29] hover:bg-orange-50 rounded-lg" title="View details">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteItem(item)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
            <span className="text-sm text-gray-500">
              {t('common.page')} {meta.currentPage} {t('common.of')} {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                {t('common.prev')}
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">
              {editItem ? t('purchase.suppliers.editTitle') : t('purchase.suppliers.addTitle')}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('purchase.suppliers.supplierName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Supplier name"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('purchase.suppliers.company')}
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Company name"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('purchase.suppliers.phone')}
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('purchase.suppliers.email')}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('purchase.suppliers.address')}
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  placeholder="Full address"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none"
                />
              </div>
              {!editItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('purchase.suppliers.openingBalance')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.openingBalance}
                    onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={creating || updating}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2"
              >
                {(creating || updating) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editItem ? t('common.update') : t('purchase.suppliers.addSupplier')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-[#26272F] mb-2">
              {t('purchase.suppliers.deleteTitle')}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t('purchase.suppliers.deleteWarning')}{' '}
              <span className="font-medium">{deleteItem.name}</span>.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60 flex items-center gap-2"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />} {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllSupplier;
