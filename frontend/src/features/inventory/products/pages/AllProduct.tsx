import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";
import DeleteAction from "../../../../components/ui/actions/DeleteIcon";
import EditIcon from "../../../../components/ui/actions/EditWithLinkIcon";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useGetAllProductsQuery } from "../productApi";
import CommonPagination from "../../../../components/ui/paginations/CommonPagination";
import StatusBadge from "../../../../components/ui/status/StatusBadge";
import { ImageDisplay } from "../../../../components/ui/modal/ImageDisply";
import { EmptyState } from "../../../../components/ui/status/EmptyState";

const ProductList: React.FC = () => {
  const [searchValue, setSearchValue] = useState({
    search: "",
    limit: 10,
    page: 1,
  });

  // ✅ Debounced search
  const debouncedSearch = useDebounce(searchValue.search, 500);

  // ✅ RTK Query with debounced search
  const {
    data: productData,
    error,
    isFetching,
    refetch,
  } = useGetAllProductsQuery({
    ...searchValue,
    search: debouncedSearch,
  });
  // Sample data

  const products = productData?.data?.data || [];
  const meta = productData?.data?.meta || { totalItems: 0, totalPages: 1 };
  console.log(products, "products");
  const handleDeleteCategory = async (category) => {};

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product List</h1>
          <p className="text-gray-600 mt-1">Manage your products</p>
        </div>
        <div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to={"/admin/manage-products/add-product"} className="btn">
              Add New Product
            </Link>
            <button className="btn">Import Product</button>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="table-container mt-8">
        <div>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search product name or slug..."
                value={searchValue.search}
                onChange={(e) =>
                  setSearchValue({
                    ...searchValue,
                    search: e.target.value.trim(),
                    page: 1,
                  })
                }
                className="search-input"
                disabled={isFetching}
              />
            </div>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto mt-4">
          <div className="table-section w-full">
            <table className="table w-full">
              <thead>
                <tr className="table-row">
                  <th>#</th>
                  <th>IMAGE</th>
                  <th>NAME</th>
                  <th>PRODUCT TYPE</th>
                  <th>SKU</th>
                  <th>PRICE</th>
                  <th>Stock</th>
                  <th>Variant</th>
                  <th>STATUS</th>
                  <th className="text-center!">ACTION</th>
                </tr>
              </thead>
              {products?.length === 0 && !isFetching ? (
                <tbody>
                  <td colSpan={10}>
                    <EmptyState
                      message="No products found"
                      actionText="Add Your First Product"
                    />
                  </td>
                </tbody>
              ) : (
                <tbody className="table-body">
                  {products.map((product: any, index: number) => {
                    const image =
                      [...product?.images]?.find((img) => img.isThumbnail)
                        ?.url || "";
                    console.log(image, "image");
                    return (
                      <tr key={product.id}>
                        <td>{index + 1}</td>
                        <td>
                          <ImageDisplay
                            src={image}
                            alt={product.name}
                            className="w-10 h-10"
                          />
                        </td>
                        <td>
                          {" "}
                          <span className="text-wrap">{product.name}</span>{" "}
                        </td>
                        <td className="capitalize">{product.type}</td>
                        <td>{product.sku || "N/A"}</td>
                        <td>{Number(product.basePrice).toFixed(2)}</td>
                        <td>{Number(product.baseStock).toFixed(2)}</td>
                        <td>
                          <StatusBadge isActive={product?.hasVariants} />
                        </td>
                        <td>
                          <StatusBadge isActive={product?.isActive} />
                        </td>
                        <td>
                          {" "}
                          <div className="flex items-center justify-center w-full gap-2">
                            <EditIcon
                              link={`/admin/manage-products/edit-product/${product.id}`}
                            />

                            <DeleteAction
                              handleDelete={handleDeleteCategory}
                              item={product}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>

          {/* 4. Pagination Integration */}
          {products.length > 0 && (
            <div>
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
    </div>
  );
};

export default ProductList;
