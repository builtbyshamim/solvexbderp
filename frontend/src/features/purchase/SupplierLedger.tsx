import { useState } from 'react';
import { Search, Download, BookOpen, SlidersHorizontal, X } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import {
  useGetAllSuppliersQuery,
  useGetSupplierLedgerQuery,
  useCreateSupplierAdjustmentMutation,
} from './purchaseApi';
import CommonPagination from '../../components/ui/paginations/CommonPagination';
import toast from 'react-hot-toast';

const typeColors: Record<string, string> = {
  purchase:   'bg-blue-100 text-blue-700',
  payment:    'bg-green-100 text-green-700',
  return:     'bg-yellow-100 text-yellow-700',
  adjustment: 'bg-purple-100 text-purple-700',
};

const EMPTY_ADJ = () => ({
  date: new Date().toISOString().split('T')[0],
  type: 'debit' as 'debit' | 'credit',
  amount: '',
  note: '',
});

const SupplierLedger = () => {
  const { t } = useLanguage();
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [searchValue, setSearchValue] = useState({ page: 1, limit: 20 });
  const [supplierSearch, setSupplierSearch] = useState('');

  // Adjustment modal state
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjForm, setAdjForm] = useState(EMPTY_ADJ());

  const { data: suppliersData } = useGetAllSuppliersQuery({ limit: 500 });
  const suppliers = suppliersData?.data || [];

  const { data: ledgerData, isFetching: loadingLedger } = useGetSupplierLedgerQuery(
    { supplierId: selectedSupplierId, ...searchValue },
    { skip: !selectedSupplierId },
  );

  const [createAdjustment, { isLoading: adjSaving }] = useCreateSupplierAdjustmentMutation();

  const entries = ledgerData?.data || [];
  const meta = ledgerData?.meta || { totalItems: 0, totalPages: 1 };
  const selectedSupplier = ledgerData?.supplier ?? suppliers.find((s: any) => s.id === selectedSupplierId);

  const filteredSuppliers = suppliers.filter((s: any) =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()),
  );

  const openAdj = () => { setAdjForm(EMPTY_ADJ()); setAdjOpen(true); };
  const closeAdj = () => setAdjOpen(false);

  const handleAdjSubmit = async () => {
    if (!adjForm.amount || Number(adjForm.amount) <= 0) {
      toast.error('Enter a valid amount'); return;
    }
    try {
      await createAdjustment({
        supplierId: selectedSupplierId,
        data: { ...adjForm, amount: Number(adjForm.amount) },
      }).unwrap();
      toast.success('Adjustment saved');
      setSearchValue((p) => ({ ...p })); // refetch
      closeAdj();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save adjustment');
    }
  };

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
      <div className="bg-white border border-[#DBDFE9] rounded-lg p-4 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
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
          onChange={(e) => { setSelectedSupplierId(e.target.value); setSearchValue({ page: 1, limit: 20 }); }}
          className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
        >
          <option value="">Select a supplier...</option>
          {filteredSuppliers.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {selectedSupplier && (
          <>
            <div className="flex items-center gap-4 ml-auto text-sm">
              <div>
                <span className="text-gray-400 text-xs">Opening Balance</span>
                <div className="font-semibold text-[#26272F]">
                  ৳{Number(selectedSupplier.openingBalance).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Current Balance</span>
                <div className={`font-bold ${Number(selectedSupplier.currentBalance) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  ৳{Number(selectedSupplier.currentBalance).toLocaleString()}
                </div>
              </div>
            </div>
            <button
              onClick={openAdj}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" /> Adjust
            </button>
          </>
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
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No ledger entries found</td>
                  </tr>
                ) : (
                  entries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(entry.createdAt ?? entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#ff6d29]">
                        {entry.referenceId ?? entry.reference ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${typeColors[entry.transactionType ?? entry.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {entry.transactionType ?? entry.type ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-red-500 font-medium">
                        {Number(entry.debit ?? 0) > 0 ? `৳${Number(entry.debit).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-green-600 font-medium">
                        {Number(entry.credit ?? 0) > 0 ? `৳${Number(entry.credit).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#26272F]">
                        ৳{Number(entry.balanceAfter ?? entry.balance ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[140px]">
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

      {/* ── Adjustment Modal ── */}
      {adjOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DBDFE9]">
              <h3 className="text-base font-semibold text-[#26272F]">Ledger Adjustment — {selectedSupplier?.name}</h3>
              <button onClick={closeAdj} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['debit', 'credit'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAdjForm((f) => ({ ...f, type: t }))}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        adjForm.type === t
                          ? t === 'debit'
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : 'border-green-500 bg-green-50 text-green-600'
                          : 'border-[#DBDFE9] text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {t === 'debit' ? '▲ Debit (owe more)' : '▼ Credit (owe less)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
                <input
                  type="date"
                  value={adjForm.date}
                  onChange={(e) => setAdjForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount (৳)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={adjForm.amount}
                  onChange={(e) => setAdjForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Note (optional)</label>
                <textarea
                  rows={2}
                  value={adjForm.note}
                  onChange={(e) => setAdjForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Reason for adjustment..."
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-[#DBDFE9] flex justify-end gap-3">
              <button
                onClick={closeAdj}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjSubmit}
                disabled={adjSaving}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-60 transition-colors"
              >
                {adjSaving ? 'Saving…' : 'Save Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierLedger;
