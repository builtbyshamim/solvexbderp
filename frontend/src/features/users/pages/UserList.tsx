// ===== UserList.tsx =====
import React, { useState } from 'react';
import { FiSearch, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { useDebounce } from '../../../hooks/useDebounce';
import { useGetAllUserQuery } from '../userApi';
import { EmptyState } from '../../../components/ui/status/EmptyState';
import { ImageDisplay } from '../../../components/ui/modal/ImageDisply';
import StatusBadge from '../../../components/ui/status/StatusBadge';
import DeleteAction from '../../../components/ui/actions/DeleteIcon';
import EditWithLinkIcon from '../../../components/ui/actions/EditWithLinkIcon';

type SortOrder = 'ASC' | 'DESC';

interface SearchState {
  search: string;
  limit: number;
  page: number;
  sortBy: string;
  sortOrder: SortOrder;
  role: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps {
  total: number;
  totalPage: number;
  page: number;
  limit: number;
  disabled: boolean;
  setSearchValue: React.Dispatch<React.SetStateAction<SearchState>>;
  refetch: () => void;
}

const CommonPagination: React.FC<PaginationProps> = ({
  total,
  totalPage,
  page,
  limit,
  disabled,
  setSearchValue,
  refetch,
}) => {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const goTo = (p: number) => {
    if (p < 1 || p > totalPage || disabled) return;
    setSearchValue((prev) => ({ ...prev, page: p }));
    refetch();
  };

  // Build page numbers with ellipsis
  const pages: (number | '...')[] = [];
  if (totalPage <= 7) {
    for (let i = 1; i <= totalPage; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPage - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPage - 2) pages.push('...');
    pages.push(totalPage);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <p className="text-sm text-gray-500">
        Showing{' '}
        <span className="font-medium text-gray-700">
          {from}–{to}
        </span>{' '}
        of <span className="font-medium text-gray-700">{total}</span> users
      </p>
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => goTo(page - 1)}
          disabled={page === 1 || disabled}
          className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          ← Prev
        </button>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p as number)}
              disabled={disabled}
              className={`min-w-[34px] px-2 py-1.5 text-sm border rounded-md transition-colors ${
                p === page
                  ? 'bg-blue-600 text-white border-blue-600 font-medium'
                  : 'hover:bg-gray-50 disabled:opacity-40'
              }`}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => goTo(page + 1)}
          disabled={page === totalPage || disabled}
          className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

// ─── Sort Header ──────────────────────────────────────────────────────────────
const SortHeader: React.FC<{
  label: string;
  field: string;
  currentSortBy: string;
  currentOrder: SortOrder;
  onSort: (field: string) => void;
}> = ({ label, field, currentSortBy, currentOrder, onSort }) => (
  <th className="cursor-pointer select-none whitespace-nowrap" onClick={() => onSort(field)}>
    <div className="flex items-center gap-1">
      {label}
      <span className="flex flex-col text-gray-400 text-[10px] leading-none">
        <FiChevronUp
          className={currentSortBy === field && currentOrder === 'ASC' ? 'text-blue-500' : ''}
        />
        <FiChevronDown
          className={currentSortBy === field && currentOrder === 'DESC' ? 'text-blue-500' : ''}
        />
      </span>
    </div>
  </th>
);

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 10 }).map((_, i) => (
      <td key={i}>
        <div className="h-4 bg-gray-100 rounded w-full" />
      </td>
    ))}
  </tr>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UserList: React.FC = () => {
  const [searchValue, setSearchValue] = useState<SearchState>({
    search: '',
    limit: 10,
    page: 1,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    role: '',
  });

  const debouncedSearch = useDebounce(searchValue.search, 500);

  const {
    data: userData,
    isFetching,
    isError,
    refetch,
  } = useGetAllUserQuery({
    ...searchValue,
    search: debouncedSearch,
  });

  // ✅ Correct: backend returns { data: { data: [...], meta: {...} } }
  const users = userData?.data ?? [];
  const meta = userData?.meta ?? { totalItems: 0, totalPages: 1 };

  const handleSort = (field: string) => {
    setSearchValue((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'DESC' ? 'ASC' : 'DESC',
      page: 1,
    }));
  };

  const handleDelete = async (user: any) => {
    // TODO: wire up deleteCustomer mutation
    console.log('delete user id:', user.id);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User List</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your users</p>
        </div>
        {/* Optional: add invite / export button here */}
      </div>

      {/* Filters */}
      <div className="table-container mt-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
          {/* Search */}
          <div className="relative max-w-sm w-full">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Search by name, email, mobile…"
              value={searchValue.search}
              onChange={(e) =>
                setSearchValue((prev) => ({ ...prev, search: e.target.value.trim(), page: 1 }))
              }
              className="search-input pl-9"
              disabled={isFetching}
            />
          </div>

          {/* Role Filter */}
          <select
            className="border rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={searchValue.role}
            onChange={(e) => setSearchValue((prev) => ({ ...prev, role: e.target.value, page: 1 }))}
            disabled={isFetching}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          {/* Per-page */}
          <select
            className="border rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={searchValue.limit}
            onChange={(e) =>
              setSearchValue((prev) => ({
                ...prev,
                limit: Number(e.target.value),
                page: 1,
              }))
            }
            disabled={isFetching}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>

          {/* Loading indicator */}
          {isFetching && <span className="text-xs text-gray-400 self-center">Loading…</span>}
        </div>

        {/* Error state */}
        {isError && (
          <div className="text-red-500 text-sm py-3 px-4 bg-red-50 rounded-md mb-4">
            Failed to load users. Please try again.
          </div>
        )}

        {/* Table */}
        <div className="max-w-full overflow-x-auto mt-4">
          <div className="table-section w-full">
            <table className="table w-full text-sm">
              <thead>
                <tr className="table-row">
                  <th className="w-10">#</th>
                  <th>AVATAR</th>
                  <SortHeader
                    label="NAME"
                    field="name"
                    currentSortBy={searchValue.sortBy}
                    currentOrder={searchValue.sortOrder}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="EMAIL"
                    field="email"
                    currentSortBy={searchValue.sortBy}
                    currentOrder={searchValue.sortOrder}
                    onSort={handleSort}
                  />
                  <th>MOBILE</th>
                  <SortHeader
                    label="ROLE"
                    field="role"
                    currentSortBy={searchValue.sortBy}
                    currentOrder={searchValue.sortOrder}
                    onSort={handleSort}
                  />
                  <th>VERIFIED</th>
                  <th>BANNED</th>
                  <SortHeader
                    label="JOINED"
                    field="createdAt"
                    currentSortBy={searchValue.sortBy}
                    currentOrder={searchValue.sortOrder}
                    onSort={handleSort}
                  />
                  <th className="text-center">ACTION</th>
                </tr>
              </thead>

              <tbody className="table-body">
                {/* Skeleton while loading */}
                {isFetching &&
                  users.length === 0 &&
                  Array.from({ length: searchValue.limit > 5 ? 5 : searchValue.limit }).map(
                    (_, i) => <SkeletonRow key={i} />,
                  )}

                {/* Empty state */}
                {!isFetching && users.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <EmptyState message="No users found" />
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {users.map((user: any, index: number) => (
                  <tr key={user.id} className={isFetching ? 'opacity-50' : ''}>
                    <td className="text-gray-500">
                      {(searchValue.page - 1) * searchValue.limit + index + 1}
                    </td>

                    <td>
                      <ImageDisplay
                        src={user.avatar}
                        alt={user.name ?? user.email}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    </td>

                    <td className="font-medium text-gray-800">
                      {user.name || <span className="text-gray-400">—</span>}
                    </td>

                    <td className="text-gray-600">{user.email}</td>

                    <td className="text-gray-600">
                      {user.mobile || <span className="text-gray-400">—</span>}
                    </td>

                    <td>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td>
                      <StatusBadge isActive={user.isVerified} />
                    </td>

                    <td>
                      <StatusBadge isActive={user.isBanned} />
                    </td>

                    <td className="text-gray-500 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <EditWithLinkIcon link={`/admin/manage-users/mlm/${user.id}`} />
                        <DeleteAction handleDelete={handleDelete} item={user} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination — only show when data exists */}
          {!isFetching && users.length > 0 && (
            <CommonPagination
              total={meta.totalItems}
              totalPage={meta.totalPages}
              setSearchValue={setSearchValue}
              refetch={refetch}
              limit={searchValue.limit}
              page={searchValue.page}
              disabled={isFetching}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserList;
