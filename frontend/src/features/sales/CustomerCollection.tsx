import { useState, useEffect } from 'react';
import { CreditCard, Loader2, Zap, X, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import {
  useGetAllCustomersQuery,
  useGetAllSalesQuery,
  useCollectPaymentMutation,
  useCollectBulkPaymentMutation,
} from './salesApi';
import { useGetAllAccountsQuery } from '../accounting/accountingApi';

const fmtN = (n: number | string) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type CollectionMode = 'invoice' | 'bulk';

interface InvoiceRow {
  saleId: string;
  invoiceNo: string;
  saleDate: string;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  amount: string;
  rebate: string;
  selected: boolean;
}

const today = new Date().toISOString().split('T')[0];

const CustomerCollection = () => {
  const [customerId, setCustomerId] = useState('');
  const [mode, setMode] = useState<CollectionMode>('invoice');
  const [accountId, setAccountId] = useState('');
  const [collectionDate, setCollectionDate] = useState(today);
  const [note, setNote] = useState('');
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkRebate, setBulkRebate] = useState('');
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick collection modal state
  const [quickOpen, setQuickOpen] = useState(false);
  const [qCustomerId, setQCustomerId] = useState('');
  const [qAmount, setQAmount] = useState('');
  const [qRebate, setQRebate] = useState('');
  const [qAccountId, setQAccountId] = useState('');
  const [qNote, setQNote] = useState('');
  const [qSubmitting, setQSubmitting] = useState(false);

  const { data: customersData } = useGetAllCustomersQuery({ limit: 500 });
  const customers: any[] = customersData?.data ?? [];

  const { data: accountsData } = useGetAllAccountsQuery({ limit: 100 });
  const accounts: any[] = accountsData?.data ?? [];

  const { data: salesData, isLoading: salesLoading } = useGetAllSalesQuery(
    { customerId, limit: 200 },
    { skip: !customerId },
  );

  const [collectPayment] = useCollectPaymentMutation();
  const [collectBulkPayment] = useCollectBulkPaymentMutation();

  // Rebuild invoice rows when customer's sales arrive
  useEffect(() => {
    const sales: any[] = salesData?.data ?? [];
    const outstanding = sales.filter(
      (s) => ['unpaid', 'partial'].includes(s.paymentStatus) && s.status !== 'cancelled',
    );
    setRows(
      outstanding.map((s) => ({
        saleId: s.id,
        invoiceNo: s.invoiceNo,
        saleDate: s.saleDate,
        grandTotal: Number(s.grandTotal),
        paidAmount: Number(s.paidAmount),
        dueAmount: Number(s.dueAmount),
        amount: String(Number(s.dueAmount)),
        rebate: '0',
        selected: false,
      })),
    );
  }, [salesData]);

  // Reset rows when customer changes
  useEffect(() => {
    setRows([]);
    setBulkAmount('');
    setBulkRebate('');
    setNote('');
  }, [customerId]);

  const selectedCustomer = customers.find((c: any) => c.id === customerId);
  const selected = rows.filter((r) => r.selected);
  const totalCollect = selected.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalRebate = selected.reduce((s, r) => s + Number(r.rebate || 0), 0);
  const netInvoice = totalCollect - totalRebate;
  const bulkNet = Number(bulkAmount || 0) - Number(bulkRebate || 0);

  const toggle = (saleId: string) =>
    setRows((prev) => prev.map((r) => (r.saleId === saleId ? { ...r, selected: !r.selected } : r)));

  const updateField = (saleId: string, field: 'amount' | 'rebate', value: string) =>
    setRows((prev) => prev.map((r) => (r.saleId === saleId ? { ...r, [field]: value } : r)));

  const selectAll = () => setRows((prev) => prev.map((r) => ({ ...r, selected: true })));
  const deselectAll = () => setRows((prev) => prev.map((r) => ({ ...r, selected: false })));

  const handleInvoiceCollect = async () => {
    if (!selected.length) { toast.error('Select at least one invoice'); return; }
    for (const r of selected) {
      const amt = Number(r.amount);
      const reb = Number(r.rebate);
      if (!amt || amt <= 0) { toast.error(`Enter valid amount for ${r.invoiceNo}`); return; }
      if (reb < 0) { toast.error(`Rebate cannot be negative for ${r.invoiceNo}`); return; }
      if (amt + reb > r.dueAmount + 0.01) { toast.error(`Amount + Rebate exceeds due for ${r.invoiceNo}`); return; }
    }
    setIsSubmitting(true);
    let done = 0;
    try {
      for (const r of selected) {
        await collectPayment({
          id: r.saleId,
          data: { amount: Number(r.amount), rebate: Number(r.rebate) || 0, accountId: accountId || undefined, note, collectionDate },
        }).unwrap();
        done++;
      }
      toast.success(`${done} invoice(s) collected`);
      deselectAll();
      setNote('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Collection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkCollect = async () => {
    const amt = Number(bulkAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (Number(bulkRebate) < 0) { toast.error('Rebate cannot be negative'); return; }
    setIsSubmitting(true);
    try {
      await collectBulkPayment({
        customerId,
        data: { amount: amt, rebate: Number(bulkRebate) || 0, accountId: accountId || undefined, note, collectionDate },
      }).unwrap();
      toast.success('Collection recorded');
      setBulkAmount('');
      setBulkRebate('');
      setNote('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Collection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCollect = async () => {
    if (!qCustomerId) { toast.error('Select a customer'); return; }
    const amt = Number(qAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setQSubmitting(true);
    try {
      await collectBulkPayment({
        customerId: qCustomerId,
        data: { amount: amt, rebate: Number(qRebate) || 0, accountId: qAccountId || undefined, note: qNote, collectionDate: today },
      }).unwrap();
      toast.success('Quick collection done');
      setQuickOpen(false);
      setQCustomerId(''); setQAmount(''); setQRebate(''); setQNote(''); setQAccountId('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Collection failed');
    } finally {
      setQSubmitting(false);
    }
  };

  const canSubmit = customerId && accountId && !isSubmitting &&
    (mode === 'invoice' ? selected.length > 0 : !!bulkAmount);

  return (
    <div>
      <PageHeader
        title="Customer Collection"
        subtitle="Collect payments invoice-wise or as an overall payment with optional rebate"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Sales', path: '/admin/sales/list' },
          { label: 'Collection' },
        ]}
        actions={
          <button
            onClick={() => setQuickOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
          >
            <Zap className="h-4 w-4" /> Quick Collection
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main form ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Step 1 – Customer */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#ff6d29] text-white text-xs flex items-center justify-center font-bold">1</span>
              Select Customer
            </h3>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            >
              <option value="">— Choose a customer —</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.mobile ? ` (${c.mobile})` : ''}{Number(c.currentBalance) > 0 ? ` · Due ৳${Number(c.currentBalance).toLocaleString()}` : ''}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="text-sm font-semibold text-[#26272F]">{selectedCustomer.name}</p>
                </div>
                {selectedCustomer.mobile && (
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-700">{selectedCustomer.mobile}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Total Due</p>
                  <p className="text-base font-bold text-orange-600">৳{Number(selectedCustomer.currentBalance ?? 0).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2 – Mode */}
          {customerId && (
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-[#26272F] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#ff6d29] text-white text-xs flex items-center justify-center font-bold">2</span>
                Collection Mode
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(['invoice', 'bulk'] as CollectionMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      mode === m
                        ? 'border-[#ff6d29] bg-orange-50 text-[#ff6d29]'
                        : 'border-[#DBDFE9] text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {m === 'invoice' ? 'Invoice-wise' : 'Overall Collection'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 – Invoice-wise */}
          {customerId && mode === 'invoice' && (
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#26272F] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#ff6d29] text-white text-xs flex items-center justify-center font-bold">3</span>
                  Outstanding Invoices
                  {rows.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">{rows.length}</span>
                  )}
                </h3>
                {rows.length > 0 && (
                  <div className="flex gap-3 text-xs">
                    <button onClick={selectAll} className="text-[#ff6d29] hover:underline">Select All</button>
                    <button onClick={deselectAll} className="text-gray-400 hover:underline">Clear</button>
                  </div>
                )}
              </div>

              {salesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#ff6d29]" />
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-300" />
                  <p className="text-sm text-gray-400">No outstanding invoices</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rows.map((row) => (
                    <div
                      key={row.saleId}
                      className={`rounded-lg border-2 p-4 transition-all ${
                        row.selected ? 'border-[#ff6d29] bg-orange-50/50' : 'border-[#DBDFE9] hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggle(row.saleId)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#ff6d29] cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          {/* Invoice header row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-bold text-[#ff6d29]">{row.invoiceNo}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(row.saleDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-gray-500">Total: <span className="font-medium text-[#26272F]">৳{fmtN(row.grandTotal)}</span></span>
                              <span className="text-green-600">Paid: <span className="font-medium">৳{fmtN(row.paidAmount)}</span></span>
                              <span className="text-red-600 font-bold">Due: ৳{fmtN(row.dueAmount)}</span>
                            </div>
                          </div>
                          {/* Amount + Rebate inputs (shown when selected) */}
                          {row.selected && (
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Collect Amount</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">৳</span>
                                  <input
                                    type="number" min="0" step="0.01"
                                    value={row.amount}
                                    onChange={(e) => updateField(row.saleId, 'amount', e.target.value)}
                                    className="w-full pl-6 pr-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateField(row.saleId, 'amount', String(row.dueAmount))}
                                  className="mt-1 text-xs text-[#ff6d29] hover:underline"
                                >
                                  Full due
                                </button>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Rebate / Discount</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">৳</span>
                                  <input
                                    type="number" min="0" step="0.01"
                                    value={row.rebate}
                                    onChange={(e) => updateField(row.saleId, 'rebate', e.target.value)}
                                    className="w-full pl-6 pr-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                                  />
                                </div>
                                {Number(row.rebate) > 0 && (
                                  <p className="mt-1 text-xs text-green-600">
                                    Net: ৳{fmtN(Number(row.amount || 0) - Number(row.rebate))}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3 – Overall Collection */}
          {customerId && mode === 'bulk' && (
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-[#26272F] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#ff6d29] text-white text-xs flex items-center justify-center font-bold">3</span>
                Collection Amount
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Collection Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">৳</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                    />
                  </div>
                  {selectedCustomer && Number(selectedCustomer.currentBalance) > 0 && (
                    <button
                      type="button"
                      onClick={() => setBulkAmount(String(Number(selectedCustomer.currentBalance)))}
                      className="mt-1 text-xs text-[#ff6d29] hover:underline"
                    >
                      Full due: ৳{Number(selectedCustomer.currentBalance).toLocaleString()}
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Rebate / Discount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">৳</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={bulkRebate}
                      onChange={(e) => setBulkRebate(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                    />
                  </div>
                </div>
              </div>
              {(Number(bulkAmount) > 0 || Number(bulkRebate) > 0) && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-gray-600">Net Collection</span>
                  <span className={`text-lg font-bold ${bulkNet >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    ৳{fmtN(bulkNet)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 4 – Payment Details */}
          {customerId && (
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-[#26272F] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#ff6d29] text-white text-xs flex items-center justify-center font-bold">4</span>
                Payment Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Deposit to Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                  >
                    <option value="">— Select account —</option>
                    {accounts.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.name} {a.currentBalance !== undefined ? `(৳${Number(a.currentBalance).toLocaleString()})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Collection Date</label>
                  <input
                    type="date"
                    value={collectionDate}
                    onChange={(e) => setCollectionDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="e.g. Cash collected by sales rep..."
                    className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Summary sidebar ── */}
        {customerId && (
          <div>
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 sticky top-4">
              <h3 className="text-sm font-semibold text-[#26272F] mb-4">Collection Summary</h3>

              {mode === 'invoice' ? (
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Selected Invoices</span>
                    <span className="font-semibold text-[#26272F]">{selected.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Collect Amount</span>
                    <span className="font-semibold">৳{fmtN(totalCollect)}</span>
                  </div>
                  {totalRebate > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Total Rebate</span>
                      <span>−৳{fmtN(totalRebate)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#DBDFE9] pt-3 flex justify-between font-bold text-base">
                    <span>Net Collection</span>
                    <span className="text-green-700">৳{fmtN(netInvoice)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Amount</span>
                    <span className="font-semibold">৳{fmtN(bulkAmount || 0)}</span>
                  </div>
                  {Number(bulkRebate) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Rebate</span>
                      <span>−৳{fmtN(bulkRebate)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#DBDFE9] pt-3 flex justify-between font-bold text-base">
                    <span>Net Collection</span>
                    <span className="text-green-700">৳{fmtN(bulkNet)}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-[#DBDFE9] space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Account</span>
                  <span className="font-medium text-right max-w-[120px] truncate">
                    {accounts.find((a: any) => a.id === accountId)?.name || <span className="text-red-400">Not selected</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date</span>
                  <span className="font-medium">{collectionDate}</span>
                </div>
              </div>

              <button
                onClick={mode === 'invoice' ? handleInvoiceCollect : handleBulkCollect}
                disabled={!canSubmit}
                className="w-full mt-5 py-3 bg-[#ff6d29] text-white rounded-lg text-sm font-semibold hover:bg-[#e65a1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <CreditCard className="h-4 w-4" />}
                Confirm Collection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Collection Modal ── */}
      {quickOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-[#26272F] flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#ff6d29]" /> Quick Collection
              </h2>
              <button onClick={() => setQuickOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Customer *</label>
                <select
                  value={qCustomerId}
                  onChange={(e) => setQCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                >
                  <option value="">— Select customer —</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.mobile ? ` (${c.mobile})` : ''}
                      {Number(c.currentBalance) > 0 ? ` · Due ৳${Number(c.currentBalance).toLocaleString()}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">৳</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={qAmount}
                      onChange={(e) => setQAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Rebate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">৳</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={qRebate}
                      onChange={(e) => setQRebate(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Deposit to Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={qAccountId}
                  onChange={(e) => setQAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                >
                  <option value="">— Select account —</option>
                  {accounts.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.currentBalance !== undefined ? `(৳${Number(a.currentBalance).toLocaleString()})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Note</label>
                <input
                  type="text"
                  value={qNote}
                  onChange={(e) => setQNote(e.target.value)}
                  placeholder="Optional note..."
                  className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                />
              </div>

              {Number(qAmount) > 0 && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex justify-between items-center">
                  <span className="text-sm text-gray-600">Net Collection</span>
                  <span className="text-base font-bold text-green-700">
                    ৳{fmtN(Number(qAmount) - Number(qRebate || 0))}
                  </span>
                </div>
              )}

              <button
                onClick={handleQuickCollect}
                disabled={qSubmitting || !qCustomerId || !qAmount || !qAccountId}
                className="w-full py-3 bg-[#ff6d29] text-white rounded-lg text-sm font-semibold hover:bg-[#e65a1f] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {qSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Collect Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCollection;
