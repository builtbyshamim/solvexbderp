import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package } from 'lucide-react';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useGetAllProductsQuery } from '../productApi';
import CommonPagination from '../../../../components/ui/paginations/CommonPagination';
import { ImageDisplay } from '../../../../components/ui/modal/ImageDisply';
import PageHeader from '../../../../components/shared/PageHeader';

const AllProduct = () => {
  const [searchValue, setSearchValue] = useState({ search: '', limit: 10, page: 1 });
  const debouncedSearch = useDebounce(searchValue.search, 500);

  const { data: productData, isFetching, refetch } = useGetAllProductsQuery({
    ...searchValue,
    search: debouncedSearch,
  });

  const products = productData?.data?.data || [];
  const meta = productData?.data?.meta || { totalItems: 0, totalPages: 1 };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalogue"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Inventory', path: '/admin/inventory/products' },
          { label: 'Products' },
        ]}
        actions={
          <Link
            to="/admin/inventory/products/add"
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchValue.search}
              onChange={(e) => setSearchValue({ ...searchValue, search: e.target.value.trim(), page: 1 })}
              disabled={isFetching}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
          <span className="text-sm text-gray-500">{meta.totalItems} products</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Image', 'Name', 'Type', 'SKU', 'Price', 'Stock', 'Variant', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 font-medium">No products found</p>
                  <Link to="/admin/inventory/products/add" className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
                    <Plus className="h-4 w-4" /> Add First Product
                  </Link>
                </td></tr>
              ) : (
                products.map((product: any, index: number) => {
                  const thumbnail = [...(product?.images ?? [])].find((img) => img.isThumbnail)?.url || '';
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{(searchValue.page - 1) * searchValue.limit + index + 1}</td>
                      <td className="px-4 py-3">
                        <ImageDisplay src={thumbnail} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-[#DBDFE9]" />
                      </td>
                      <td className="px-4 py-3 font-medium text-[#26272F] max-w-[180px]">
                        <span className="line-clamp-2">{product.name}</span>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">{product.type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.sku || '—'}</td>
                      <td className="px-4 py-3 font-semibold">৳{Number(product.basePrice).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">{Number(product.baseStock).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.hasVariants ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {product.hasVariants ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/inventory/products/edit/${product.id}`}
                          className="px-3 py-1.5 text-xs border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                          Edit
                        </Link>
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
