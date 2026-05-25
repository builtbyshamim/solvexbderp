import { useState } from "react";
import {
  useDeleteCategoryMutation,
  useGetAllCategoryQuery,
} from "../categoryApi";
import { FiSearch } from "react-icons/fi";
import DeleteAction from "../../../../components/ui/actions/DeleteIcon";
import CommonPagination from "../../../../components/ui/paginations/CommonPagination";
import { ErrorState } from "../../../../components/ui/status/ErrorState";
import { EmptyState } from "../../../../components/ui/status/EmptyState";
import StatusBadge from "../../../../components/ui/status/StatusBadge";
import EditWithActionIcon from "../../../../components/ui/actions/EditWithActionIcon";
import toast from "react-hot-toast";
import { ImageDisplay } from "../../../../components/ui/modal/ImageDisply";
import CommonModal from "../../../../components/ui/modal/CommonModal";
import AddCategory from "./AddCategory";
import EditCategory from "./EditCategory";
import { useDebounce } from "../../../../hooks/useDebounce";

// Reusable Image Component
const AllCategory = () => {
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
    data: categoryData,
    error,
    isFetching,
    refetch,
  } = useGetAllCategoryQuery({
    ...searchValue,
    search: debouncedSearch,
  });

  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();

  const categories = categoryData?.data?.data || [];
  const meta = categoryData?.data?.meta || { totalItems: 0, totalPages: 1 };

  const handleDeleteCategory = async (category: any) => {
    try {
      const result = await deleteCategory(category?.id).unwrap();
      if (result?.sccess) {
        toast.success(result?.message || "Category deleted successfully!");
      } else {
        toast.success(result?.message || "Category deleted fail!");
      }
    } catch (error: any) {
      // Handle different error scenarios
      if (error?.data?.message?.includes("products")) {
        toast.error(
          "Cannot delete category because it has associated products. Remove the products first.",
        );
      } else if (error?.status === 403) {
        toast.error("You don't have permission to delete categories.");
      } else if (error?.status === 401) {
        toast.error("Please login again to perform this action.");
      } else {
        toast.error(
          error?.data?.message ||
            "Failed to delete category. Please try again.",
        );
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Category List</h1>
          <p className="text-gray-600 mt-1">
            Manage your categories and hierarchy
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setAddItem(true)}
            className="btn bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add New Category
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
            message={error?.data?.message || "Failed to fetch categories"}
            refetch={refetch}
          />
        ) : (
          <div className="max-w-full overflow-x-auto mt-4">
            {/* Loading indicator during refetch */}
            {/* {isFetching && !isLoading && <TableSkeleton />} */}

            {/* 3. Empty State */}
            {categories.length === 0 && !isFetching ? (
              <EmptyState
                message="No categories found"
                actionText="Add Your First Category"
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
                    {categories?.map((category: any, index: number) => (
                      <tr key={category._id}>
                        <td>
                          {(searchValue.page - 1) * searchValue.limit +
                            index +
                            1}
                        </td>
                        <td>
                          <ImageDisplay
                            src={category?.image}
                            alt={category.name}
                            className="w-10 h-10"
                          />
                        </td>
                        <td className="font-medium">{category.name}</td>
                        <td>
                          <StatusBadge isActive={category?.isActive} />
                        </td>
                        <td>
                          <div className="flex items-center justify-center w-full gap-2">
                            <EditWithActionIcon
                              item={category}
                              onClick={setOpenEditModal}
                              disabled={isDeleting || isFetching}
                            />

                            <DeleteAction
                              handleDelete={() =>
                                handleDeleteCategory(category)
                              }
                              item={category}
                              disabled={isDeleting}
                              itemName={category?.name}
                              tooltip="Delete category"
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
        {categories.length > 0 && (
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
        title="Add New Category"
      >
        <AddCategory onClose={() => setAddItem(false)} />
      </CommonModal>

      <CommonModal
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
        title="Update New Category"
      >
        <EditCategory
          category={openEditModal}
          onClose={() => setOpenEditModal(false)}
        />
      </CommonModal>
    </div>
  );
};

export default AllCategory;
