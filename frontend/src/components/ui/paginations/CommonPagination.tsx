
import ReactPaginate from "react-paginate";
import {
  MdKeyboardDoubleArrowRight,
  MdKeyboardDoubleArrowLeft,
} from "react-icons/md";

const CommonPagination = ({
  total, 
  totalPage, 
  setSearchValue,
  searchValue,
  limit,
  page,
}: any) => {
  // Page change handle
  const handlePageClick = ({ selected }) => {
    setSearchValue((prev) => ({ ...prev, page: selected + 1 }));
  };

  // Rows per page (Limit) change handle
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    if (newLimit >= 1) {
      setSearchValue((prev) => ({
        ...prev,
        limit: newLimit,
        page: 1, // Limit change korle page oboshoy 1-e nite hobe
      }));
    }
  };

  // Showing range calculation (e.g., 1-10 of 100)
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="w-full flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white py-4 px-6 border-t border-gray-100">
      {/* Left: Info & Limit Selector */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Show</span>
          <select
            value={limit}
            onChange={handleLimitChange}
            className="border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <p>
          Showing{" "}
          <span className="font-semibold text-gray-700">
            {from}-{to}
          </span>{" "}
          of <span className="font-semibold text-gray-700">{total}</span>{" "}
          entries
        </p>
      </div>

      {/* Right: Pagination Navigation */}
      <ReactPaginate
        forcePage={page - 1} // Syncs external state with component
        onPageChange={handlePageClick}
        pageCount={totalPage || 1}
        marginPagesDisplayed={1}
        pageRangeDisplayed={2}
        // Styling Classes
        containerClassName="flex items-center gap-1 list-none"
        pageLinkClassName="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-sm font-medium hover:bg-primary-500 hover:text-white cursor-pointer  transition-colors"
        activeLinkClassName="bg-primary-500 text-white border-primary-500 shadow-sm"
        previousLabel={<MdKeyboardDoubleArrowLeft size={18} />}
        previousLinkClassName={`w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50 ${page === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
        nextLabel={<MdKeyboardDoubleArrowRight size={18} />}
        nextLinkClassName={`w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50 ${page === totalPage ? "opacity-50 cursor-not-allowed" : ""}`}
        breakLabel="..."
        breakLinkClassName="w-7 h-7 flex items-center justify-center"
        disabledClassName="opacity-50 cursor-not-allowed"
      />
    </div>
  );
};

export default CommonPagination;
