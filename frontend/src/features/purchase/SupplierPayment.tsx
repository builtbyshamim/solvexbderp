import { useState, useEffect } from 'react';
import { Loader2, Zap, CheckCircle2, X, Wallet } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import {
  useGetAllSuppliersQuery,
  useGetSupplierDuePurchasesQuery,
  usePaySupplierMutation,
} from './purchaseApi';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

const fmt = (n: number | string) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = new Date().toISOString().split('T')[0];

type PayMode = 'invoice' | 'bulk';

interface InvoiceRow {
  purchaseId: string;
  invoiceNo: string;
  purchaseDate: string;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  amount: string;
  selected: boolean;
}

const SupplierPayment = () => {
  const [supplierId, setSupplierId] = useState('');
  const [mode, setMode] = useState<PayMode>('invoice');
  const [method, setMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(today);
  const [note, setNote] = useState('');
  const [bulkAmount, setBulkAmount] = useState('');
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick payment modal
  const [quickOpen, setQuickOpen] = useState(false);
  const [qSupplierId, setQSupplierId] = useState('');
  const [qAmount, setQAmount] = useState('');
  const [qMethod, setQMethod] = useState('cash');
  const [qNote, setQNote] = useState('');
  const [qSubmitting, setQSubmitting] = useState(false);

  const { data: suppliersData } = useGetAllSuppliersQuery({ limit: 500 });
  const suppliers: any[] = suppliersData?.data ?? [];

  const { data: dueData, isLoading: dueLoading } = useGetSupplierDuePurchasesQuery(supplierId, {
    skip: !supplierId,
  });

  const [paySupplier] = usePaySupplierMutation();

  useEffect(() => {
    const purchases: any[] = dueData?.data ?? [];
    setRows(
      purchases.map((p) => ({
        purchaseId: p.id,
        invoiceNo: p.invoiceNo,
        purchaseDate: p.purchaseDate,
        grandTotal: Number(p.grandTotal),
        paidAmount: Number(p.paidAmount),
        dueAmount: Number(p.dueAmount),
        amount: String(Number(p.dueAmount)),
        selected: false,
      })),
    );
  }, [dueData]);

  useEffect(() => {
    setRows([]);
    setBulkAmount('');
    setNote('');
  }, [supplierId]);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const quickSupplier = suppliers.find((s) => s.id === qSupplierId);
  const selected = rows.filter((r) => r.selected);
  const totalSelected = selected.reduce((s, r) => s + Number(r.amount || 0), 0);

  const toggle = (id: string) =>
    setRows((prev) => prev.map((r) => (r.purchaseId === id ? { ...r, selected: !r.selected } : r)));

  const updateAmount = (id: string, value: string) =>
    setRows((prev) => prev.map((r) => (r.purchaseId === id ? { ...r, amount: value } : r)));

  const selectAll = () => setRows((prev) => prev.map((r) => ({ ...r, selected: true })));
  const clearAll = () => setRows((prev) => prev.map((r) => ({ ...r, selected: false })));

  const handleInvoicePay = async () => {
    if (!selected.length) { toast.error('Select at least one invoice'); return; }
    for (const r of selected) {
      const amt = Number(r.amount);
      if (!amt || amt <= 0) { toast.error(`Enter valid amount for ${r.invoiceNo}`); return; }
      if (amt > r.dueAmount + 0.01) { toast.error(`Amount exceeds due for ${r.invoiceNo}`); return; }
    }
    setIsSubmitting(true);
    try {
      const totalAmt = selected.reduce((s, r) => s + Number(r.amount), 0);
      await paySupplier({
        supplierId,
        data: {
          amount: totalAmt,
          paymentMethod: method,
          note,
          paymentDate,
          invoicePayments: selected.map((r) => ({ purchaseId: r.purchaseId, amount: Number(r.amount) })),
        },
      }).unwrap();
      toast.success(`Payment of ৳${fmt(totalAmt)} recorded`);
      clearAll();
      setNote('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkPay = async () => {
    const amt = Number(bulkAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (selectedSupplier && amt > Number(selectedSupplier.currentBalance) + 0.01) {
      toast.error('Amount exceeds supplier payable balance'); return;
    }
    setIsSubmitting(true);
    try {
      await paySupplier({
        supplierId,
        data: { amount: amt, paymentMethod: method, note, paymentDate },
      }).unwrap();
      toast.success(`Payment of ৳${fmt(amt)} recorded`);
      setBulkAmount('');
      setNote('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPay = async () => {
    if (!qSupplierId) { toast.error('Select a supplier'); return; }
    const amt = Number(qAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setQSubmitting(true);
    try {
      await paySupplier({
        supplierId: qSupplierId,
        data: { amount: amt, paymentMethod: qMethod, note: qNote, paymentDate: today },
      }).unwrap();
      toast.success('Quick payment recorded');
      setQuickOpen(false);
      setQSupplierId(''); setQAmount(''); setQNote(''); setQMethod('cash');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Payment failed');
    } finally {
      setQSubmitting(false);
    }
  };

  const canSubmit = supplierId && !isSubmitting &&
    (mode === 'invoice' ? selected.length > 0 : !!bulkAmount);

  return (
    <div>
      <PageHeader
        title="Supplier Payment"
        subtitle="Pay your suppliers invoice-wise or as a bulk payment"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Purchase', path: '/admin/purchase/list' },
          { label: 'Supplier Payment' },
        ]}
        actions={
          <button
            onClick={() => setQuickOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
          >
            <Zap className="h-4 w-4" /> Quick Pay
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left / Main ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Step 1 — Supplier */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#ff6d29] text-white text-xs flex items-center justify-center font-bold">1</span>
              Select Supplier
            </h3>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            >
              <option value="">— Choose a supplier —</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.phone ? ` (${s.phone})` : ''}
                  {Number(s.currentBalance) > 0 ? ` · Payable ৳${Number(s.currentBalance).toLocaleString()}` : ''}
                </option>
              ))}
            </select>

            {selectedSupplier && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div>
                  <p className="text-xs text-gray-500">Supplier</p>
                  <p className="text-sm font-semibold text-[#26272F]">{selectedSupplier.name}</p>
                  {selectedSupplier.company && (
                    <p className="text-xs text-gray-400">{selectedSupplier.company}</p>
                  )}
                </div>
                {selectedSupplier.phone && (
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-700">{selectedSupplier.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Total Payable</p>
                  <p className="text-base font-bold text-orange-600">
                    ৳{fmt(selectedSupplier.currentBalance ?? 0)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2 — Mode */}
          {supplierId && (
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-[#26272F] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#ff6d29] text-white text-xs flex items-center justify-center font-bold">2</span>
                Payment Mode
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(['invoice', 'bulk'] as PayMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                      mode === m
                        ? 'border-[#ff6d29] bg-orange-50 text-[#ff6d29]'
                        : 'border-[#DBDFE9] text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {m === 'invoice' ? 'Invoice-wise' : 'Overall Payment'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Invoice-wise */}
          {supplierId && mode === 'invoice' && (
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
                    <button onClick={clearAll} className="text-gray-400 hover:underline">Clear</button>
                  </div>
                )}
              </div>

              {dueLoading ? (
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
                      key={row.purchaseId}
                      className={`rounded-lg border-2 p-4 transition-all ${
                        row.selected ? 'border-[#ff6d29] bg-orange-50/50' : 'border-[#DBDFE9] hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggle(row.purchaseId)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#ff6d29] cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div>
                              <span className="text-sm font-semibold text-[#26272F]">{row.invoiceNo}</span>
                              <span className="ml-2 text-xs text-gray-400">
                                {new Date(row.purchaseDate).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Due</p>
                              <p className="text-sm font-bold text-red-500">৳{fmt(row.dueAmount)}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                            <span>Invoice Total: <strong className="text-gray-700">৳{fmt(row.grandTotal)}</strong></span>
                            <span>Paid: <strong className="text-green-600">৳{fmt(row.paidAmount)}</strong></span>
                          </div>
                          {row.selected && (
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Pay Amount</label>
                              <input
                                type="number"
                                value={row.amount}
                                min={0.01}
                                max={row.dueAmount}
                                step="0.01"
                                onChange={(e) => updateAmount(row.purchaseId, e.target.value)}
                                className="w-full px-3 py-1.5 border border-[#DBDFE9] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                              />
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

          {/* Step 3 — Bulk */}
          {supplierId && mode === 'bulk' && (
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-[#26272F] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#ff6d29] text-white text-xs flex items-center justify-center font-bold">3</span>
                Payment Amount
              </h3>
              <div>
                <label className="input-label">Amount to Pay <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                  placeholder="0.00"
                  min={0.01}
                  step="0.01"
                  className="input-style"
                />
                {selectedSupplier && bulkAmount && (
                  <p className="mt-1 text-xs text-gray-400">
                    Remaining after payment: ৳{fmt(Math.max(0, Number(selectedSupplier.currentBalance) - Number(bulkAmount)))}
                  </p>
                )}
              </div>
              <p className="mt-3 text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded px-3 py-2">
                Payment will be automatically applied to the oldest invoices first.
              </p>
            </div>
          )}

          {/* Step 4 — Payment Details */}
          {supplierId && (
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-[#26272F] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#ff6d29] text-white text-xs flex items-center justify-center font-bold">
                  {mode === 'invoice' ? '4' : '4'}
                </span>
                Payment Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Payment Method</label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMethod(m.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          method === m.value
                            ? 'bg-[#ff6d29] border-[#ff6d29] text-white'
                            : 'border-[#DBDFE9] text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="input-label">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="input-style"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="input-label">Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Payment reference, cheque number, etc."
                    rows={2}
                    className="input-style resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right — Summary ── */}
        <div className="space-y-5">
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 sticky top-4">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#ff6d29]" />
              Payment Summary
            </h3>

            {!supplierId ? (
              <p className="text-sm text-gray-400 text-center py-6">Select a supplier to begin</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Supplier</span>
                  <span className="font-medium text-[#26272F] text-right max-w-[140px] truncate">
                    {selectedSupplier?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Payable</span>
                  <span className="font-semibold text-red-500">
                    ৳{fmt(selectedSupplier?.currentBalance ?? 0)}
                  </span>
                </div>
                <div className="h-px bg-[#DBDFE9]" />

                {mode === 'invoice' ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Invoices Selected</span>
                      <span className="font-medium">{selected.length} / {rows.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total to Pay</span>
                      <span className="font-bold text-[#ff6d29] text-base">৳{fmt(totalSelected)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Balance After</span>
                      <span className="font-medium text-gray-700">
                        ৳{fmt(Math.max(0, Number(selectedSupplier?.currentBalance ?? 0) - totalSelected))}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Paying Now</span>
                      <span className="font-bold text-[#ff6d29] text-base">
                        ৳{fmt(bulkAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Balance After</span>
                      <span className="font-medium text-gray-700">
                        ৳{fmt(Math.max(0, Number(selectedSupplier?.currentBalance ?? 0) - Number(bulkAmount || 0)))}
                      </span>
                    </div>
                  </>
                )}

                <div className="h-px bg-[#DBDFE9]" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium capitalize">{PAYMENT_METHODS.find((m) => m.value === method)?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{new Date(paymentDate).toLocaleDateString('en-GB')}</span>
                </div>
              </div>
            )}

            <button
              onClick={mode === 'invoice' ? handleInvoicePay : handleBulkPay}
              disabled={!canSubmit}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#ff6d29] text-white rounded-lg text-sm font-semibold hover:bg-[#e65a1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
              ) : (
                <><Wallet className="h-4 w-4" /> Record Payment</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Pay Modal ── */}
      {quickOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#DBDFE9]">
              <h2 className="text-base font-bold text-[#26272F] flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#ff6d29]" /> Quick Pay
              </h2>
              <button onClick={() => setQuickOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="input-label">Supplier <span className="text-red-500">*</span></label>
                <select
                  value={qSupplierId}
                  onChange={(e) => setQSupplierId(e.target.value)}
                  className="input-style"
                >
                  <option value="">— Select supplier —</option>
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.phone ? ` (${s.phone})` : ''}
                      {Number(s.currentBalance) > 0 ? ` · ৳${Number(s.currentBalance).toLocaleString()}` : ''}
                    </option>
                  ))}
                </select>
                {quickSupplier && (
                  <p className="mt-1 text-xs text-orange-600 font-medium">
                    Payable: ৳{fmt(quickSupplier.currentBalance ?? 0)}
                  </p>
                )}
              </div>
              <div>
                <label className="input-label">Amount <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={qAmount}
                  onChange={(e) => setQAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-style"
                />
              </div>
              <div>
                <label className="input-label">Payment Method</label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setQMethod(m.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        qMethod === m.value
                          ? 'bg-[#ff6d29] border-[#ff6d29] text-white'
                          : 'border-[#DBDFE9] text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">Note (optional)</label>
                <input
                  type="text"
                  value={qNote}
                  onChange={(e) => setQNote(e.target.value)}
                  placeholder="Reference, cheque no..."
                  className="input-style"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#DBDFE9]">
              <button
                onClick={() => setQuickOpen(false)}
                className="flex-1 px-4 py-2.5 border border-[#DBDFE9] rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickPay}
                disabled={qSubmitting || !qSupplierId || !qAmount}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-semibold hover:bg-[#e65a1f] disabled:opacity-40"
              >
                {qSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPayment;
