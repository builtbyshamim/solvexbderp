import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  X, Smartphone, CheckCircle2, Clock, AlertCircle, Copy,
} from 'lucide-react';
import {
  useCreatePaymentRequestMutation,
  useGetMyPendingRequestQuery,
  type PaymentMethod,
  type PaymentRequest,
} from '../../redux/api/billingApi';
import type { Package } from '../../redux/api/packagesApi';

const RECEIVE_NUMBER = '01617650797';

const METHOD_CONFIG = {
  bkash:  { label: 'bKash',  color: 'bg-pink-500',   hover: 'hover:bg-pink-600',   text: 'text-pink-700',  bg: 'bg-pink-50',  border: 'border-pink-300' },
  rocket: { label: 'Rocket', color: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-300' },
  nagad:  { label: 'Nagad',  color: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300' },
} as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pkg: Package;
  billingCycle: 'monthly' | 'yearly';
  onSuccess?: () => void;
}

function PendingBanner({ req }: { req: PaymentRequest }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-amber-800 text-sm">Payment Under Review</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Admin is verifying your payment. Subscription will be activated shortly.
          </p>
        </div>
      </div>
      <div className="bg-white border border-[#DBDFE9] rounded-xl divide-y divide-gray-100 text-sm">
        {[
          ['Method',         req.paymentMethod.toUpperCase()],
          ['Sender Mobile',  req.senderMobile],
          ['Transaction ID', req.transactionId],
          ['Amount',         `৳${req.amount.toLocaleString()}`],
          ['Plan',           `${req.package?.name ?? '—'} (${req.billingCycle})`],
          ['Submitted',      new Date(req.createdAt).toLocaleString()],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-gray-500">{k}</span>
            <span className="font-medium text-[#26272F]">{v}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-gray-400">
        Need help? Call or WhatsApp: <strong>{RECEIVE_NUMBER}</strong>
      </p>
    </div>
  );
}

export default function PaymentRequestModal({ isOpen, onClose, pkg, billingCycle, onSuccess }: Props) {
  const amount = billingCycle === 'yearly' ? pkg.yearlyPrice : pkg.monthlyPrice;

  const [method, setMethod]       = useState<PaymentMethod>('bkash');
  const [senderMobile, setSender] = useState('');
  const [txnId, setTxnId]         = useState('');
  const [copied, setCopied]       = useState(false);

  const { data: pending, refetch } = useGetMyPendingRequestQuery();
  const [submit, { isLoading }]    = useCreatePaymentRequestMutation();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSender('');
      setTxnId('');
      setMethod('bkash');
      refetch();
    }
  }, [isOpen, refetch]);

  const copyNumber = () => {
    navigator.clipboard.writeText(RECEIVE_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderMobile.trim() || !txnId.trim()) return;

    try {
      await submit({
        packageId: pkg.id,
        billingCycle,
        paymentMethod: method,
        senderMobile: senderMobile.trim(),
        transactionId: txnId.trim(),
        amount,
      }).unwrap();
      toast.success('Payment request submitted! Admin will activate your subscription soon.');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to submit. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-[#26272F] text-lg">Submit Payment Request</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {pkg.name} — {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} — ৳{amount.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {pending ? (
            <PendingBanner req={pending} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Payment instructions */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">How to Pay</p>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Open your bKash / Rocket / Nagad app</li>
                  <li>Go to <strong>Send Money</strong></li>
                  <li>
                    Send{' '}
                    <strong>৳{amount.toLocaleString()}</strong> to:
                  </li>
                </ol>
                <div className="flex items-center gap-2 mt-2 p-2.5 bg-white border border-blue-300 rounded-lg">
                  <Smartphone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="font-bold text-[#26272F] text-base tracking-wide flex-1">
                    {RECEIVE_NUMBER}
                  </span>
                  <button
                    type="button"
                    onClick={copyNumber}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-blue-600">Note the <strong>Transaction ID</strong> from your app and fill below.</p>
              </div>

              {/* Method selector */}
              <div>
                <label className="block text-sm font-semibold text-[#26272F] mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(METHOD_CONFIG) as [PaymentMethod, typeof METHOD_CONFIG.bkash][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMethod(key)}
                      className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        method === key
                          ? `${cfg.color} text-white border-transparent shadow-sm`
                          : `bg-white ${cfg.text} ${cfg.border} hover:${cfg.bg}`
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender mobile */}
              <div>
                <label className="block text-sm font-semibold text-[#26272F] mb-1.5">
                  Your Sender Mobile
                  <span className="text-xs text-gray-400 font-normal ml-1">(the number you sent from)</span>
                </label>
                <input
                  type="tel"
                  value={senderMobile}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="e.g. 01712345678"
                  required
                  className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/30 focus:border-[#ff6d29]"
                />
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-semibold text-[#26272F] mb-1.5">
                  Transaction ID (TxnID)
                </label>
                <input
                  type="text"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  placeholder="e.g. 8AP12345678"
                  required
                  className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/30 focus:border-[#ff6d29]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Find this in your {method === 'bkash' ? 'bKash' : method === 'rocket' ? 'Rocket' : 'Nagad'} transaction history.
                </p>
              </div>

              {/* Amount confirm */}
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-[#ff6d29] flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Confirm you sent exactly{' '}
                  <strong className="text-[#ff6d29]">৳{amount.toLocaleString()}</strong>
                  {' '}to <strong>{RECEIVE_NUMBER}</strong>.
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !senderMobile.trim() || !txnId.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#ff6d29] hover:bg-[#e65a1f] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {isLoading && (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
