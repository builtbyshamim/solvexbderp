import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Wallet, Plus, X, ChevronDown, ChevronUp,
  Package, User, Calendar, Hash, FileText, CheckCircle2, Trash2,
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useGetPurchaseQuery, usePayPurchaseDueMutation, useDeletePurchaseMutation } from './purchaseApi';
import { useGetAllAccountsQuery } from '../accounting/accountingApi';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number | string) =>
  Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const paymentStatusStyle: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-red-100 text-red-500',
};

const purchaseStatusStyle: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-200 text-gray-400',
};

// ─── Payment split types ─────────────────────────────────────────────────────

interface PaySplit { _id: number; accountId: string; amount: string; }
const newSplit = (): PaySplit => ({ _id: Date.now() + Math.random(), accountId: '', amount: '' });

// ─── Multi-account payment panel ─────────────────────────────────────────────

const PayPanel = ({
  dueAmount,
  supplierId,
  purchaseId,
}: {
  dueAmount: number;
  supplierId: string;
  purchaseId: string;
}) => {
  const [open, setOpen] = useState(false);
  const [splits, setSplits] = useState<PaySplit[]>([newSplit()]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const { data: accountsData } = useGetAllAccountsQuery({});
  const accounts: any[] = accountsData ?? [];
  const [payPurchaseDue, { isLoading }] = usePayPurchaseDueMutation();

  const totalSplits = splits.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remaining = dueAmount - totalSplits;

  const update = (_id: number, patch: Partial<PaySplit>) =>
    setSplits((prev) => prev.map((s) => (s._id === _id ? { ...s, ...patch } : s)));

  const remove = (_id: number) => {
    if (splits.length === 1) return;
    setSplits((prev) => prev.filter((s) => s._id !== _id));
  };

  const handlePay = async () => {
    const active = splits.filter((p) => Number(p.amount) > 0);
    if (!active.length) { toast.error('Enter payment amount'); return; }
    if (active.some((p) => !p.accountId)) { toast.error('Select an account for every payment row'); return; }
    if (totalSplits > dueAmount + 0.01) { toast.error(`Payment ৳${fmt(totalSplits)} exceeds due ৳${fmt(dueAmount)}`); return; }

    for (const split of active) {
      const acc = accounts.find((a) => a.id === split.accountId);
      if (acc && Number(acc.currentBalance) < Number(split.amount)) {
        toast.error(`Insufficient balance in "${acc.name}"`); return;
      }
    }

    try {
      await payPurchaseDue({
        supplierId,
        purchaseId,
        data: {
          payments: active.map((p) => ({ accountId: p.accountId, amount: Number(p.amount) })),
          totalPaid: totalSplits,
          paymentDate,
          note: note || undefined,
        },
      }).unwrap();
      toast.success(`Payment of ৳${fmt(totalSplits)} recorded`);
      setOpen(false);
      setSplits([newSplit()]);
      setNote('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Payment failed');
    }
  };

  return (
    <div className="border border-[#DBDFE9] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors"
      >
        <span className="text-sm font-semibold text-[#ff6d29] flex items-center gap-2">
          <Wallet className="h-4 w-4" /> Pay Due — ৳{fmt(dueAmount)}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-[#ff6d29]" /> : <ChevronDown className="h-4 w-4 text-[#ff6d29]" />}
      </button>

      {open && (
        <div className="p-4 space-y-3 bg-white">
          {/* Quick fill */}
          <div className="flex gap-2">
            <button type="button"
              onClick={() => setSplits([{ ...splits[0], amount: String(dueAmount) }])}
              className="text-xs px-3 py-1.5 border border-green-300 text-green-700 rounded-lg hover:bg-green-50">
              Full Pay (৳{fmt(dueAmount)})
            </button>
          </div>

          {/* Splits */}
          <div className="space-y-2">
            {splits.map((split) => {
              const acc = accounts.find((a) => a.id === split.accountId);
              const splitAmt = Number(split.amount) || 0;
              const after = acc ? Number(acc.currentBalance) - splitAmt : null;
              const insufficient = after !== null && after < 0;

              return (
                <div key={split._id} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <select
                      value={split.accountId}
                      onChange={(e) => update(split._id, { accountId: e.target.value })}
                      className={`flex-1 px-2.5 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#ff6d29] ${
                        split.amount && !split.accountId ? 'border-orange-300 bg-orange-50' : 'border-[#DBDFE9]'
                      }`}
                    >
                      <option value="">— Select account —</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} — ৳{Number(a.currentBalance).toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={split.amount}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      onChange={(e) => update(split._id, { amount: e.target.value })}
                      onFocus={() => {
                        if (!split.amount && remaining > 0) update(split._id, { amount: String(remaining.toFixed(2)) });
                      }}
                      className={`w-28 px-2 py-2 border rounded-lg text-sm text-right focus:outline-none focus:border-[#ff6d29] ${
                        insufficient ? 'border-red-400 bg-red-50' : 'border-[#DBDFE9]'
                      }`}
                    />
                    <button type="button" onClick={() => remove(split._id)} disabled={splits.length === 1}
                      className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-0 flex-shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {acc && split.amount && (
                    <p className={`text-xs pl-1 ${insufficient ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {acc.name}: ৳{fmt(Number(acc.currentBalance))} → ৳{fmt(after!)}
                      {insufficient && ' (insufficient!)'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button type="button"
            onClick={() => setSplits((prev) => [...prev, newSplit()])}
            className="flex items-center gap-1 text-xs text-[#ff6d29] hover:text-[#e65a1f] font-medium">
            <Plus className="h-3.5 w-3.5" /> Add Account
          </button>

          {/* Allocation status */}
          {totalSplits > 0 && (
            <div className="flex justify-between text-xs pt-1">
              <span className="text-gray-500">Total allocating</span>
              <span className={`font-semibold ${totalSplits > dueAmount ? 'text-red-500' : 'text-green-600'}`}>
                ৳{fmt(totalSplits)}
              </span>
            </div>
          )}

          {/* Date + Note */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-[#DBDFE9]">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payment Date</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Note</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Optional…"
                className="w-full px-2 py-1.5 border border-[#DBDFE9] rounded text-sm focus:outline-none focus:border-[#ff6d29]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={isLoading || totalSplits === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-semibold hover:bg-[#e65a1f] disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            {isLoading ? 'Processing…' : `Record Payment ৳${totalSplits > 0 ? fmt(totalSplits) : '0'}`}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PurchaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetPurchaseQuery(id!, { skip: !id });
  const [deletePurchase, { isLoading: isDeleting }] = useDeletePurchaseMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const purchase = data?.data ?? data;

  const handleDelete = async () => {
    try {
      await deletePurchase(id!).unwrap();
      toast.success('Purchase deleted successfully');
      navigate('/admin/purchase/list');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete purchase');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6d29]" />
      </div>
    );
  }

  if (isError || !purchase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-gray-500">Purchase not found.</p>
        <Link to="/admin/purchase/list" className="text-[#ff6d29] text-sm hover:underline">← Back to list</Link>
      </div>
    );
  }

  const dueAmount = Number(purchase.dueAmount ?? 0);
  const paidAmount = Number(purchase.paidAmount ?? 0);
  const grandTotal = Number(purchase.grandTotal ?? 0);
  const subtotal = Number(purchase.subtotal ?? 0);
  const discount = Number(purchase.discountAmount ?? 0);
  const tax = Number(purchase.taxAmount ?? 0);
  const shipping = Number(purchase.shippingCost ?? 0);

  return (
    <div>
      <PageHeader
        title={`Purchase — ${purchase.invoiceNo}`}
        subtitle={`${purchase.supplier?.name ?? 'Unknown supplier'} · ${new Date(purchase.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Purchases', path: '/admin/purchase/list' },
          { label: purchase.invoiceNo },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/purchase/list"
              className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: details ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Purchase Info */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Purchase Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Invoice No.</p>
                  <p className="font-mono font-semibold text-[#ff6d29]">{purchase.invoiceNo}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Purchase Date</p>
                  <p className="font-medium text-[#26272F]">
                    {new Date(purchase.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Supplier</p>
                  <p className="font-medium text-[#26272F]">{purchase.supplier?.name ?? '—'}</p>
                  {purchase.supplier?.phone && <p className="text-xs text-gray-400">{purchase.supplier.phone}</p>}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${purchaseStatusStyle[purchase.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {purchase.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Payment</p>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${paymentStatusStyle[purchase.paymentStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                  {purchase.paymentStatus}
                </span>
              </div>
              {purchase.note && (
                <div className="col-span-2 sm:col-span-3 flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Note</p>
                    <p className="text-sm text-gray-600">{purchase.note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#ff6d29]" /> Purchase Items
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DBDFE9] bg-gray-50">
                    {['#', 'Product', 'Qty', 'Unit Cost', 'Discount', 'Total'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(purchase.items ?? []).map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-[#26272F]">
                        {item.product?.name ?? item.productId}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{Number(item.quantity).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-gray-600">৳{fmt(item.unitCost)}</td>
                      <td className="px-3 py-2.5 text-gray-500">
                        {Number(item.discountAmount) > 0 ? `৳${fmt(item.discountAmount)}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-[#26272F]">৳{fmt(item.total)}</td>
                    </tr>
                  ))}
                  {(!purchase.items || purchase.items.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-gray-400 text-xs">No items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT: summary + payment ── */}
        <div className="space-y-4">

          {/* Order Summary */}
          <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#26272F] mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>৳{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span className="text-green-600">−৳{fmt(discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>+৳{fmt(tax)}</span>
                </div>
              )}
              {shipping > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>+৳{fmt(shipping)}</span>
                </div>
              )}
              <div className="border-t border-[#DBDFE9] pt-2 flex justify-between font-bold text-[#26272F] text-base">
                <span>Grand Total</span>
                <span>৳{fmt(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#DBDFE9] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Paid</span>
                <span className="font-semibold text-green-600">৳{fmt(paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Amount</span>
                <span className={`font-bold text-lg ${dueAmount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  ৳{fmt(dueAmount)}
                </span>
              </div>
            </div>

            {/* Payment status badge */}
            {dueAmount === 0 ? (
              <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-green-700">Fully Paid</span>
              </div>
            ) : (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
                <p className="text-xs text-red-500 font-medium">Due Amount</p>
                <p className="text-2xl font-bold text-red-600">৳{fmt(dueAmount)}</p>
              </div>
            )}
          </div>

          {/* Pay panel — only if due */}
          {dueAmount > 0 && purchase.supplierId && (
            <PayPanel
              dueAmount={dueAmount}
              supplierId={purchase.supplierId}
              purchaseId={purchase.id}
            />
          )}

          {/* Supplier quick info */}
          {purchase.supplier && (
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Supplier</h4>
              <p className="font-semibold text-[#26272F] text-sm">{purchase.supplier.name}</p>
              {purchase.supplier.phone && <p className="text-xs text-gray-500 mt-0.5">{purchase.supplier.phone}</p>}
              {purchase.supplier.company && <p className="text-xs text-gray-400 mt-0.5">{purchase.supplier.company}</p>}
              <Link
                to={`/admin/purchase/suppliers/${purchase.supplierId}`}
                className="mt-3 block text-xs text-[#ff6d29] hover:underline"
              >
                View supplier ledger →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-[#26272F]">Delete Purchase</h3>
                <p className="text-xs text-gray-400">{purchase.invoiceNo}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              This will permanently delete the purchase and reverse all effects:
            </p>
            <ul className="text-xs text-gray-500 space-y-1 mb-5 pl-4 list-disc">
              <li>Stock quantities will be reduced back</li>
              <li>Payments made will be restored to their accounts</li>
              <li>Supplier payable balance will be adjusted</li>
            </ul>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseDetail;
