import { useState } from 'react';
import { Plus, Search, Trash2, Warehouse, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  useGetAllWarehouseQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useSetDefaultWarehouseMutation,
  useDeleteWarehouseMutation,
} from './warehouseApi';
import CommonPagination from '../../../components/ui/paginations/CommonPagination';
import PageHeader from '../../../components/shared/PageHeader';

const AllWarehouse = () => {
  const [searchValue, setSearchValue] = useState({ search: '', limit: 10, page: 1 });
  const debouncedSearch = useDebounce(searchValue.search, 500);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isFetching, error, refetch } = useGetAllWarehouseQuery({ ...searchValue, search: debouncedSearch });
  const [createWarehouse, { isLoading: isCreating }] = useCreateWarehouseMutation();
  const [updateWarehouse, { isLoading: isUpdating }] = useUpdateWarehouseMutation();
  const [setDefault, { isLoading: isSettingDefault }] = useSetDefaultWarehouseMutation();
  const [deleteWarehouse, { isLoading: isDeleting }] = useDeleteWarehouseMutation();

  const warehouses = data?.data?.data || [];
  const meta = data?.data?.meta || { totalItems: 0, totalPages: 1 };
  const isBusy = isFetching || isCreating || isUpdating || isDeleting || isSettingDefault;

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', address: '', phone: '' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, address: item.address || '', phone: item.phone || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Warehouse name is required'); return; }
    try {
      if (editItem) {
        await updateWarehouse({ id: editItem.id, data: form }).unwrap();
        toast.success('Warehouse updated');
      } else {
        await createWarehouse(form).unwrap();
        toast.success('Warehouse added');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save warehouse');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault(id).unwrap();
      toast.success('Default warehouse updated');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to set default');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWarehouse(id).unwrap();
      toast.success('Warehouse deleted');
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete warehouse');
    }
  };

  return (
    <div>
      <PageHeader
        title="Warehouses"
        subtitle="Manage storage locations"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Inventory', path: '/admin/inventory/products' }, { label: 'Warehouses' }]}
        actions={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> Add Warehouse
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search warehouses..." value={searchValue.search}
              onChange={(e) => setSearchValue({ ...searchValue, search: e.target.value, page: 1 })}
              disabled={isFetching}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <span className="text-sm text-gray-500">{meta.totalItems} warehouses</span>
        </div>

        {error ? (
          <div className="p-8 text-center text-red-500 text-sm">Failed to load warehouses. <button onClick={refetch} className="underline">Retry</button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                  {['#', 'Name', 'Address', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isFetching ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
                ) : warehouses.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-16 text-center">
                    <Warehouse className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-gray-400">No warehouses found</p>
                    <button onClick={openAdd} className="mt-3 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">Add First Warehouse</button>
                  </td></tr>
                ) : (
                  warehouses.map((wh: any, index: number) => (
                    <tr key={wh.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{(searchValue.page - 1) * searchValue.limit + index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#26272F]">{wh.name}</span>
                          {wh.isDefault && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#fff3eb] text-[#ff6d29] rounded-full text-xs font-medium">
                              <Star className="h-3 w-3 fill-current" /> Default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{wh.address || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${wh.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {wh.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!wh.isDefault && (
                            <button onClick={() => handleSetDefault(wh.id)} disabled={isBusy}
                              className="px-3 py-1.5 text-xs border border-[#ff6d29]/30 text-[#ff6d29] rounded-lg hover:bg-[#fff3eb] transition-colors disabled:opacity-50">Set Default</button>
                          )}
                          <button onClick={() => openEdit(wh)} disabled={isBusy}
                            className="px-3 py-1.5 text-xs border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">Edit</button>
                          <button onClick={() => setDeleteId(wh.id)} disabled={isBusy || wh.isDefault}
                            className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-30"
                            title={wh.isDefault ? 'Cannot delete default warehouse' : ''}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {warehouses.length > 0 && (
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
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">{editItem ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Warehouse"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. Dhaka, Bangladesh"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +8801XXXXXXXXX"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={isBusy}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50">
                {isCreating || isUpdating ? 'Saving...' : editItem ? 'Update' : 'Add Warehouse'}
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
            <h3 className="text-lg font-semibold text-[#26272F] mb-2">Delete Warehouse?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllWarehouse;
