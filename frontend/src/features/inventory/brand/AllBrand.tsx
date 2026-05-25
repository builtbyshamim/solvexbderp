import { useState } from "react";

import { FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import { useDebounce } from "../../../hooks/useDebounce";
import { useDeleteBrandMutation, useGetAllBrandQuery } from "./brandApi";
import { ErrorState } from "../../../components/ui/status/ErrorState";
import { EmptyState } from "../../../components/ui/status/EmptyState";
import { ImageDisplay } from "../../../components/ui/modal/ImageDisply";
import StatusBadge from "../../../components/ui/status/StatusBadge";
import EditWithActionIcon from "../../../components/ui/actions/EditWithActionIcon";
import DeleteAction from "../../../components/ui/actions/DeleteIcon";
import CommonPagination from "../../../components/ui/paginations/CommonPagination";
import CommonModal from "../../../components/ui/modal/CommonModal";
import AddBrand from "./AddBrand";
import EditBrand from "./EditBrand";
// Reusable Image Component
const AllBrand = () => {
  const [openEditModal, setOpenEditModal] = useState(false);
  const [addItem, setAddItem] = useState(false);
  const [searchValue, setSearchValue] = useState({
    search: "",
    limit: 10,
    page: 1,
  });

  // ✅ Debounced search
  const debouncedSearch = useDebounce(searchValue.search, 500);

  // ✅ RTK Query with debounced search
  const {
    data: brandData,
    error,
    isFetching,
    refetch,
  } = useGetAllBrandQuery({
    ...searchValue,
    search: debouncedSearch,
  });

  const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation();

  const brands = brandData?.data?.data || [];
  const meta = brandData?.data?.meta || { totalItems: 0, totalPages: 1 };

  const handleDeleteBrand = async (brand: any) => {
    try {
      const result = await deleteBrand(brand?.id).unwrap();
      if (result?.success) {
        toast.success(result?.message || "Brand deleted successfully!");
      } else {
        toast.success(result?.message || "Brand deleted fail!");
      }
    } catch (error: any) {
      // Handle different error scenarios
      if (error?.data?.message?.includes("products")) {
        toast.error(
          "Cannot delete brand because it has associated products. Remove the products first.",
        );
      } else if (error?.status === 403) {
        toast.error("You don't have permission to delete brands.");
      } else if (error?.status === 401) {
        toast.error("Please login again to perform this action.");
      } else {
        toast.error(
          error?.data?.message || "Failed to delete brand. Please try again.",
        );
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Brand List</h1>
          <p className="text-gray-600 mt-1">Manage your brands and hierarchy</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setAddItem(true)}
            className="btn bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add New Brand
          </button>
        </div>
      </div>

      <div className="table-container mt-8">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search category name or slug..."
              value={searchValue.search}
              onChange={(e) =>
                setSearchValue({
                  ...searchValue,
                  search: e.target.value,
                  page: 1,
                })
              }
              className="search-input"
              disabled={isFetching}
            />
          </div>
        </div>

        {/* 2. Error State */}
        {error ? (
          <ErrorState
            message={error?.data?.message || "Failed to fetch brands"}
            refetch={refetch}
          />
        ) : (
          <div className="max-w-full overflow-x-auto mt-4">
            {/* Loading indicator during refetch */}
            {/* {isFetching && !isLoading && <TableSkeleton />} */}

            {/* 3. Empty State */}
            {brands.length === 0 && !isFetching ? (
              <EmptyState
                message="No brands found"
                actionText="Add Your First Brand"
              />
            ) : (
              <div className="table-section w-full">
                <table className="table w-full">
                  <thead>
                    <tr className="table-row">
                      <th>#</th>
                      <th>IMAGE</th>
                      <th>NAME</th>
                      <th>STATUS</th>
                      <th className="text-center!">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {brands?.map((brand: any, index: number) => (
                      <tr key={brand._id}>
                        <td>
                          {(searchValue.page - 1) * searchValue.limit +
                            index +
                            1}
                        </td>
                        <td>
                          <ImageDisplay
                            src={brand?.logo}
                            alt={brand.name}
                            className="w-10 h-10"
                          />
                        </td>
                        <td className="font-medium">{brand.name}</td>
                        <td>
                          <StatusBadge isActive={brand?.status == "active"} />
                        </td>
                        <td>
                          <div className="flex items-center justify-center w-full gap-2">
                            <EditWithActionIcon
                              item={brand}
                              onClick={setOpenEditModal}
                              disabled={isDeleting || isFetching}
                            />

                            <DeleteAction
                              handleDelete={() => handleDeleteBrand(brand)}
                              item={brand}
                              disabled={isDeleting}
                              itemName={brand?.name}
                              tooltip="Delete brand"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. Pagination Integration */}
        {brands.length > 0 && (
          <div>
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

      <CommonModal
        isOpen={addItem}
        onClose={() => setAddItem(false)}
        title="Add New Brand"
      >
        <AddBrand onClose={() => setAddItem(false)} />
      </CommonModal>

      <CommonModal
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
        title="Update New Brand"
      >
        <EditBrand
          brand={openEditModal}
          onClose={() => setOpenEditModal(false)}
        />
      </CommonModal>
    </div>
  );
};

export default AllBrand;
