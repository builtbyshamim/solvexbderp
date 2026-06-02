import { useState } from 'react';
import { Search, Download, BookOpen } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useGetAllSuppliersQuery, useGetSupplierLedgerQuery } from './purchaseApi';
import CommonPagination from '../../components/ui/paginations/CommonPagination';

const typeColors: Record<string, string> = {
  purchase: 'bg-blue-100 text-blue-700',
  payment: 'bg-green-100 text-green-700',
  return: 'bg-yellow-100 text-yellow-700',
};

const SupplierLedger = () => {
  const { t } = useLanguage();
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [searchValue, setSearchValue] = useState({ page: 1, limit: 20 });
  const [supplierSearch, setSupplierSearch] = useState('');

  const { data: suppliersData, isFetching: loadingSuppliers } = useGetAllSuppliersQuery({
    limit: 500,
  });
  const suppliers = suppliersData?.data || [];

  const { data: ledgerData, isFetching: loadingLedger } = useGetSupplierLedgerQuery(
    { supplierId: selectedSupplierId, ...searchValue },
    { skip: !selectedSupplierId },
  );

  const entries = ledgerData?.data || [];
  const meta = ledgerData?.meta || { totalItems: 0, totalPages: 1 };
  // Prefer ledger's embedded supplier info (has live balance), fall back to list
  const selectedSupplier = ledgerData?.supplier ?? suppliers.find((s: any) => s.id === selectedSupplierId);

  const filteredSuppliers = suppliers.filter((s: any) =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Supplier Ledger"
        subtitle="View supplier account statement"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.purchase'), path: '/admin/purchase/list' },
          { label: 'Supplier Ledger' },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      {/* Supplier picker */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg p-4 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search supplier..."
            value={supplierSearch}
            onChange={(e) => setSupplierSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
          />
        </div>
        <select
          value={selectedSupplierId}
          onChange={(e) => setSelectedSupplierId(e.target.value)}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
        >
          <option value="">Select a supplier...</option>
          {filteredSuppliers.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {selectedSupplier && (
          <div className="flex items-center gap-4 ml-auto text-sm">
            <div>
              <span className="text-gray-400 text-xs">Opening Balance</span>
              <div className="font-semibold text-[#26272F]">
                ৳{Number(selectedSupplier.openingBalance).toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Current Balance</span>
              <div
                className={`font-bold ${Number(selectedSupplier.currentBalance) > 0 ? 'text-red-500' : 'text-green-600'}`}
              >
                ৳{Number(selectedSupplier.currentBalance).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {!selectedSupplierId ? (
        <div className="bg-white border border-[#DBDFE9] rounded-lg py-16 text-center text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p>Select a supplier to view their ledger</p>
        </div>
      ) : (
        <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-[#DBDFE9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#ff6d29]" />
              <span className="text-sm font-semibold">{selectedSupplier?.name} — Ledger</span>
            </div>
            <span className="text-sm text-gray-500">{meta.totalItems} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                  {['Date', 'Reference', 'Type', 'Debit', 'Credit', 'Balance', 'Note'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingLedger ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No ledger entries found
                    </td>
                  </tr>
                ) : (
                  entries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(entry.createdAt ?? entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#ff6d29]">
                        {entry.referenceId ?? entry.reference ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${typeColors[entry.transactionType ?? entry.type] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {entry.transactionType ?? entry.type ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-red-500 font-medium">
                        {Number(entry.debit ?? 0) > 0
                          ? `৳${Number(entry.debit).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-green-600 font-medium">
                        {Number(entry.credit ?? 0) > 0
                          ? `৳${Number(entry.credit).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#26272F]">
                        ৳{Number(entry.balanceAfter ?? entry.balance ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[120px]">
                        {entry.note ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta.totalPages > 1 && (
            <CommonPagination
              total={meta.totalItems}
              totalPage={meta.totalPages}
              setSearchValue={setSearchValue}
              searchValue={searchValue}
              limit={searchValue.limit}
              page={searchValue.page}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierLedger;
