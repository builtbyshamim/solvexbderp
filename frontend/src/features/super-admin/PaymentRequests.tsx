import { useState } from 'react';
import toast from 'react-hot-toast';
import { Clock, CheckCircle2, XCircle, Smartphone, CreditCard, RefreshCw } from 'lucide-react';
import {
  useGetAllPaymentRequestsQuery,
  useReviewPaymentRequestMutation,
  type PaymentRequest,
} from '../../redux/api/billingApi';

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  rejected: { bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },
} as const;

const METHOD_COLORS = {
  bkash: 'bg-pink-100 text-pink-700',
  rocket: 'bg-purple-100 text-purple-700',
  nagad: 'bg-orange-100 text-orange-700',
} as const;

function ReviewModal({ req, onClose }: { req: PaymentRequest; onClose: () => void }) {
  const [action, setAction] = useState<'approved' | 'rejected'>('approved');
  const [note, setNote] = useState('');
  const [review, { isLoading }] = useReviewPaymentRequestMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await review({ id: req.id, action, adminNote: note || undefined }).unwrap();
      toast.success(res.message);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Review failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="font-bold text-[#26272F] text-lg mb-4">Review Payment Request</h3>

        {/* Payment details */}
        <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 text-sm mb-5">
          {[
            ['Business', req.business?.name ?? '—'],
            ['Plan', `${req.package?.name ?? '—'} (${req.billingCycle})`],
            ['Method', req.paymentMethod.toUpperCase()],
            ['Sender Mobile', req.senderMobile],
            ['Transaction ID', req.transactionId],
            ['Amount', `৳${req.amount.toLocaleString()}`],
            ['Submitted', new Date(req.createdAt).toLocaleString()],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between px-3 py-2">
              <span className="text-gray-500">{k}</span>
              <span className="font-medium text-[#26272F] text-right max-w-[220px] truncate">
                {v}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action */}
          <div className="grid grid-cols-2 gap-3">
            {(['approved', 'rejected'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAction(a)}
                className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all capitalize ${
                  action === a
                    ? a === 'approved'
                      ? 'bg-green-500 text-white border-transparent'
                      : 'bg-red-500 text-white border-transparent'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {a === 'approved' ? '✓ Approve' : '✗ Reject'}
              </button>
            ))}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Admin Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={
                action === 'approved' ? 'e.g. Verified TxnID' : 'e.g. Transaction ID not found'
              }
              className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/30 focus:border-[#ff6d29]"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 min-h-[44px] transition-colors ${
                action === 'approved'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isLoading && (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isLoading
                ? 'Processing...'
                : `Confirm ${action === 'approved' ? 'Approval' : 'Rejection'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentRequests() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PaymentRequest | null>(null);

  const { data, isLoading, refetch } = useGetAllPaymentRequestsQuery({
    status: statusFilter,
    page,
    limit: 20,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#26272F]">Payment Requests</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Manual bKash / Rocket / Nagad payment submissions from businesses
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { key: 'pending', label: 'Pending', count: true },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'all', label: 'All' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setStatusFilter(key);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              statusFilter === key
                ? 'bg-[#ff6d29] text-white shadow-sm'
                : 'bg-white border border-[#DBDFE9] text-gray-500 hover:border-gray-300'
            }`}
          >
            {label}
            {key === 'pending' && statusFilter !== 'pending' && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                !
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center whitespace-nowrap">
          {total} total
        </span>
      </div>

      {/* Table / List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#ff6d29]/20 border-t-[#ff6d29] rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CreditCard className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No {statusFilter === 'all' ? '' : statusFilter} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((req) => {
            const st = STATUS_STYLES[req.status];
            const StIcon = st.icon;
            const methodCls = METHOD_COLORS[req.paymentMethod] ?? 'bg-gray-100 text-gray-700';

            return (
              <div
                key={req.id}
                className="bg-white border border-[#DBDFE9] rounded-xl p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#26272F] truncate">
                          {req.business?.name ?? 'Unknown Business'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${methodCls}`}
                        >
                          {req.paymentMethod.toUpperCase()}
                        </span>
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}
                        >
                          <StIcon className="h-3 w-3" />
                          {req.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500">
                        <span>
                          {req.package?.name ?? '—'} · {req.billingCycle}
                        </span>
                        <span>৳{req.amount.toLocaleString()}</span>
                        <span className="font-mono">TxnID: {req.transactionId}</span>
                        <span>From: {req.senderMobile}</span>
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                      {req.adminNote && (
                        <p className="text-xs text-gray-400 mt-1 italic">Note: {req.adminNote}</p>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  {req.status === 'pending' && (
                    <button
                      onClick={() => setSelected(req)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff6d29] hover:bg-[#e65a1f] text-white text-sm font-semibold transition-colors whitespace-nowrap self-start sm:self-center min-h-[44px]"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Review modal */}
      {selected && <ReviewModal req={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
