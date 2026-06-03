import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useGetAllProductsQuery, useDeleteProductMutation } from '../productApi';
import CommonPagination from '../../../../components/ui/paginations/CommonPagination';
import { ImageDisplay } from '../../../../components/ui/modal/ImageDisply';
import PageHeader from '../../../../components/shared/PageHeader';
import { useLanguage } from '../../../../context/LanguageContext';

const AllProduct = () => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState({ search: '', limit: 10, page: 1 });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchValue.search, 500);

  const {
    data: productData,
    isFetching,
    refetch,
  } = useGetAllProductsQuery({
    ...searchValue,
    search: debouncedSearch,
  });

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const products = productData?.data || [];
  const meta = productData?.meta || { totalItems: 0, totalPages: 1 };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id).unwrap();
      toast.success('Product deleted');
      setConfirmDeleteId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete product');
      setConfirmDeleteId(null);
    }
  };

  const tableHeaders = [
    '#',
    t('common.image'),
    t('common.name'),
    t('common.type'),
    t('common.sku'),
    t('common.price'),
    t('common.stock'),
    t('common.variant'),
    t('common.status'),
    t('common.actions'),
  ];

  return (
    <div>
      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Delete Product</p>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title={t('inventory.products.title')}
        subtitle={t('inventory.products.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.inventory'), path: '/admin/inventory/products' },
          { label: t('inventory.products.title') },
        ]}
        actions={
          <Link
            to="/admin/inventory/products/add"
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
          >
            <Plus className="h-4 w-4" /> {t('inventory.products.addProduct')}
          </Link>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('inventory.products.searchPlaceholder')}
              value={searchValue.search}
              onChange={(e) =>
                setSearchValue({ ...searchValue, search: e.target.value.trim(), page: 1 })
              }
              disabled={isFetching}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
          <span className="text-sm text-gray-500">
            {meta.totalItems} {t('inventory.products.title').toLowerCase()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {tableHeaders.map((h) => (
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
              {isFetching ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                    {t('inventory.products.loading')}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 font-medium">
                      {t('inventory.products.noProducts')}
                    </p>
                    <Link
                      to="/admin/inventory/products/add"
                      className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]"
                    >
                      <Plus className="h-4 w-4" /> {t('inventory.products.addFirstProduct')}
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map((product: any, index: number) => {
                  const thumbnail =
                    product.image || [...(product?.images ?? [])].find((img: any) => img.isThumbnail)?.url || '';
                  const totalStock = (product.stocks ?? []).reduce(
                    (sum: number, s: any) => sum + Number(s.currentQty ?? 0),
                    0,
                  );
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">
                        {(searchValue.page - 1) * searchValue.limit + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <ImageDisplay
                          src={thumbnail}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-[#DBDFE9]"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-[#26272F] max-w-[180px]">
                        <span className="line-clamp-2">{product.name}</span>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">
                        {product.productType ?? product.type ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {product.sku || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        ৳{Number(product.sellingPrice ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {totalStock.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.hasVariants ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {product.hasVariants
                            ? t('inventory.products.variantYes')
                            : t('inventory.products.variantNo')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}
                        >
                          {product.isActive
                            ? t('inventory.products.statusActive')
                            : t('inventory.products.statusInactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/inventory/products/edit/${product.id}`}
                            className="px-3 py-1.5 text-xs border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {t('common.edit')}
                          </Link>
                          <button
                            onClick={() => setConfirmDeleteId(product.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {products.length > 0 && (
          <div className="p-4 border-t border-[#DBDFE9]">
            <CommonPagination
              total={meta.totalItems}
              totalPage={meta.totalPages}
              setSearchValue={setSearchValue}
              searchValue={searchValue}
              refetch={refetch}
              limit={searchValue.limit}
              page={searchValue.page}
              disabled={isFetching}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllProduct;
