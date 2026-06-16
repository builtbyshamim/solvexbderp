import { useState } from 'react';
import { Search, Download, Loader2, SlidersHorizontal, X } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import {
  useGetAllCustomersQuery,
  useGetCustomerStatementQuery,
  useCreateCustomerAdjustmentMutation,
} from './salesApi';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const typeColors: Record<string, string> = {
  sale:       'bg-blue-100 text-blue-700',
  payment:    'bg-green-100 text-green-700',
  return:     'bg-orange-100 text-orange-600',
  opening:    'bg-gray-100 text-gray-600',
  adjustment: 'bg-purple-100 text-purple-700',
};

const EMPTY_ADJ = () => ({
  date: new Date().toISOString().split('T')[0],
  type: 'debit' as 'debit' | 'credit',
  amount: '',
  note: '',
});

const CustomerLedger = () => {
  const { t } = useLanguage();
  const [customerId, setCustomerId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  // Adjustment modal state
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjForm, setAdjForm] = useState(EMPTY_ADJ());

  const { data: customersData } = useGetAllCustomersQuery({ limit: 200 });
  const customers: any[] = customersData?.data ?? [];

  const { data: stmtData, isLoading, isFetching } = useGetCustomerStatementQuery(
    { customerId, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
    { skip: !customerId },
  );

  const [createAdjustment, { isLoading: adjSaving }] = useCreateCustomerAdjustmentMutation();

  const statement = stmtData;
  const entries: any[] = statement?.entries ?? [];
  const currentBalance = statement?.customer?.currentBalance ?? 0;
  const selectedCustomer = customers.find((c: any) => c.id === customerId);

  const filtered = entries.filter(
    (e: any) =>
      (e.reference ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.note ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const tableHeaders = [
    t('common.date'),
    t('common.reference'),
    t('common.type'),
    t('sales.customerLedger.debitReceivable'),
    t('sales.customerLedger.creditReceived'),
    t('common.balance'),
    t('common.note'),
  ];

  const openAdj = () => { setAdjForm(EMPTY_ADJ()); setAdjOpen(true); };
  const closeAdj = () => setAdjOpen(false);

  const handleAdjSubmit = async () => {
    if (!adjForm.amount || Number(adjForm.amount) <= 0) {
      toast.error('Enter a valid amount'); return;
    }
    try {
      await createAdjustment({
        customerId,
        data: { ...adjForm, amount: Number(adjForm.amount) },
      }).unwrap();
      toast.success('Adjustment saved');
      closeAdj();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save adjustment');
    }
  };

  return (
    <div>
      <PageHeader
        title={t('sales.customerLedger.title')}
        subtitle={t('sales.customerLedger.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.sales'), path: '/admin/sales/list' },
          { label: t('sales.customerLedger.title') },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> {t('common.export')}
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales.customerLedger.selectCustomer')}</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
              <option value="">{t('sales.customerLedger.selectCustomerOption')}</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('common.fromDate')}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('common.toDate')}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        {customerId && selectedCustomer && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-[#26272F]">{selectedCustomer.name}</span>
            {selectedCustomer.mobile && <span className="text-xs text-gray-400">{selectedCustomer.mobile}</span>}
            <span className="text-xs text-gray-500">{t('sales.customerLedger.currentBalance')}</span>
            <span className={`text-sm font-bold ${Number(currentBalance) > 0 ? 'text-orange-500' : 'text-green-600'}`}>
              ৳{Number(currentBalance).toLocaleString()}
              <span className="ml-1 font-normal text-xs">
                ({Number(currentBalance) > 0 ? t('sales.customerLedger.due') : t('sales.customerLedger.clear')})
              </span>
            </span>
            <button
              onClick={openAdj}
              className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('sales.customerLedger.searchPlaceholder')} value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {tableHeaders.map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!customerId ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                    <p>{t('sales.customerLedger.selectPrompt')}</p>
                  </td>
                </tr>
              ) : isLoading || isFetching ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">{t('sales.customerLedger.noTransactions')}</td></tr>
              ) : (
                filtered.map((entry: any, idx: number) => (
                  <tr key={entry.id ?? idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#ff6d29]">{entry.reference}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${typeColors[entry.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-orange-500">{Number(entry.debit) > 0 ? `৳${Number(entry.debit).toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{Number(entry.credit) > 0 ? `৳${Number(entry.credit).toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 font-bold text-[#26272F]">৳{Number(entry.balance).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.note ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Adjustment Modal ── */}
      {adjOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DBDFE9]">
              <h3 className="text-base font-semibold text-[#26272F]">Ledger Adjustment — {selectedCustomer?.name}</h3>
              <button onClick={closeAdj} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['debit', 'credit'] as const).map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setAdjForm((f) => ({ ...f, type: tp }))}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        adjForm.type === tp
                          ? tp === 'debit'
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-green-500 bg-green-50 text-green-600'
                          : 'border-[#DBDFE9] text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {tp === 'debit' ? '▲ Debit (owes more)' : '▼ Credit (owes less)'}
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

export default CustomerLedger;
