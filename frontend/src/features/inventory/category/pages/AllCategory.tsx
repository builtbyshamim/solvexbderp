import { useState } from 'react';
import { Plus, Search, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeleteCategoryMutation, useGetAllCategoryQuery } from '../categoryApi';
import { useDebounce } from '../../../../hooks/useDebounce';
import { ImageDisplay } from '../../../../components/ui/modal/ImageDisply';
import CommonPagination from '../../../../components/ui/paginations/CommonPagination';
import CommonModal from '../../../../components/ui/modal/CommonModal';
import AddCategory from './AddCategory';
import EditCategory from './EditCategory';
import PageHeader from '../../../../components/shared/PageHeader';
import { useLanguage } from '../../../../context/LanguageContext';

const AllCategory = () => {
  const { t } = useLanguage();
  const [editItem, setEditItem] = useState<any>(false);
  const [addOpen, setAddOpen] = useState(false);
  const [searchValue, setSearchValue] = useState({ search: '', limit: 10, page: 1 });
  const debouncedSearch = useDebounce(searchValue.search, 500);

  const { data, error, isFetching, refetch } = useGetAllCategoryQuery({ ...searchValue, search: debouncedSearch });
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const categories = data?.data || [];
  const meta = data?.meta || { totalItems: 0, totalPages: 1 };

  const handleDelete = async (category: any) => {
    try {
      await deleteCategory(category?.id).unwrap();
      toast.success('Category deleted successfully');
    } catch (err: any) {
      if (err?.data?.message?.includes('products')) {
        toast.error('Cannot delete — category has associated products.');
      } else {
        toast.error(err?.data?.message || 'Failed to delete category.');
      }
    }
  };

  return (
    <div>
      <PageHeader
        title={t('inventory.categories.title')}
        subtitle={t('inventory.categories.subtitle')}
        breadcrumbs={[{ label: t('common.home'), path: '/admin' }, { label: t('nav.inventory'), path: '/admin/inventory/products' }, { label: t('inventory.categories.title') }]}
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
          >
            <Plus className="h-4 w-4" /> {t('inventory.categories.addCategory')}
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('inventory.categories.searchPlaceholder')}
              value={searchValue.search}
              onChange={(e) => setSearchValue({ ...searchValue, search: e.target.value, page: 1 })}
              disabled={isFetching}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
          <span className="text-sm text-gray-500">{meta.totalItems} {t('inventory.categories.categoriesCount')}</span>
        </div>

        {error ? (
          <div className="p-8 text-center text-red-500 text-sm">Failed to load categories. <button onClick={refetch} className="underline">Retry</button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                  {['#', t('inventory.categories.colImage'), t('common.name'), t('common.status'), t('common.action')].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isFetching ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">{t('inventory.products.loading')}</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-16 text-center">
                    <Tag className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-gray-400">{t('inventory.categories.noCategories')}</p>
                    <button onClick={() => setAddOpen(true)} className="mt-3 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
                      {t('inventory.categories.addFirstCategory')}
                    </button>
                  </td></tr>
                ) : (
                  categories.map((cat: any, index: number) => (
                    <tr key={cat._id || cat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{(searchValue.page - 1) * searchValue.limit + index + 1}</td>
                      <td className="px-4 py-3">
                        <ImageDisplay src={cat?.image} alt={cat.name} className="w-10 h-10 rounded-lg object-cover border border-[#DBDFE9]" />
                      </td>
                      <td className="px-4 py-3 font-medium text-[#26272F]">{cat.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {cat.isActive ? t('inventory.products.statusActive') : t('inventory.products.statusInactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditItem(cat)}
                            disabled={isDeleting || isFetching}
                            className="px-3 py-1.5 text-xs border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {categories.length > 0 && (
          <div className="p-4 border-t border-[#DBDFE9]">
            <CommonPagination
              total={meta.totalItems}
              totalPage={meta.totalPages}
              setSearchValue={setSearchValue}
              searchValue={searchValue}
              refetch={refetch}
              limit={searchValue.limit}
              page={searchValue.page}
              disabled={isFetching || isDeleting}
            />
          </div>
        )}
      </div>

      <CommonModal isOpen={addOpen} onClose={() => setAddOpen(false)} title={t('inventory.categories.addTitle')}>
        <AddCategory onClose={() => setAddOpen(false)} />
      </CommonModal>

      <CommonModal isOpen={!!editItem} onClose={() => setEditItem(false)} title={t('inventory.categories.editTitle')}>
        <EditCategory category={editItem} onClose={() => setEditItem(false)} />
      </CommonModal>
    </div>
  );
};

export default AllCategory;
