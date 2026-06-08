import { useState } from 'react';
import {
  Search,
  Building2,
  MoreVertical,
  Power,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  X,
  Phone,
  Calendar,
  Package,
  AlertCircle,
  Loader2,
  RotateCcw,
  ArrowRightLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetAllBusinessesQuery,
  useToggleBusinessStatusMutation,
  useUpdateSubscriptionMutation,
  useResetBusinessDataMutation,
  useGetBusinessDetailQuery,
} from '../../redux/api/superAdminApi';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Business {
  id: string;
  name: string;
  owner: string;
  mobile: string;
  plan: string;
  status: 'active' | 'trial' | 'expired' | 'suspended';
  joinedAt: string;
  expiresAt: string | null;
  usersCount: number;
  productsCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  active: { label: 'Active', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  trial: { label: 'Trial', cls: 'bg-blue-100 text-blue-700', icon: Clock },
  expired: { label: 'Expired', cls: 'bg-red-100 text-red-600', icon: AlertTriangle },
  suspended: { label: 'Suspended', cls: 'bg-gray-100 text-gray-600', icon: XCircle },
};

const StatusBadge = ({ status }: { status: Business['status'] }) => {
  const { label, cls, icon: Icon } = STATUS_MAP[status] ?? STATUS_MAP.expired;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

// ── Confirm toggle modal ───────────────────────────────────────────────────────
const ConfirmToggleModal = ({
  business,
  action,
  onConfirm,
  onClose,
  loading,
}: {
  business: Business;
  action: 'suspend' | 'activate';
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4 ${action === 'suspend' ? 'bg-red-100' : 'bg-green-100'}`}>
        {action === 'suspend' ? <XCircle className="h-6 w-6 text-red-500" /> : <CheckCircle className="h-6 w-6 text-green-500" />}
      </div>
      <h3 className="text-base font-bold text-center text-[#26272F] mb-1">
        {action === 'suspend' ? 'Suspend Business?' : 'Activate Business?'}
      </h3>
      <p className="text-sm text-gray-500 text-center mb-5">
        {action === 'suspend'
          ? `All users of "${business.name}" will immediately lose access. Data will be preserved.`
          : `"${business.name}" will regain full access to their account.`}
      </p>
      {action === 'suspend' && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-xs text-amber-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          This action is reversible. You can reactivate at any time.
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${action === 'suspend' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {action === 'suspend' ? 'Yes, Suspend' : 'Yes, Activate'}
        </button>
      </div>
    </div>
  </div>
);

// ── Subscription action modal ──────────────────────────────────────────────────
const SubscriptionModal = ({
  business,
  onClose,
}: {
  business: Business;
  onClose: () => void;
}) => {
  const [action, setAction] = useState<string>('renew');
  const [extendMonths, setExtendMonths] = useState(1);
  const [extraDays, setExtraDays] = useState(7);
  const [note, setNote] = useState('');
  const [updateSubscription, { isLoading }] = useUpdateSubscriptionMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSubscription({
        id: business.id,
        action,
        extend_months: action === 'renew' ? extendMonths : undefined,
        extra_days: action === 'extend_trial' ? extraDays : undefined,
        note: note || undefined,
      }).unwrap();
      toast.success(`Action "${action}" applied to "${business.name}"`);
      onClose();
    } catch {
      toast.error('Failed to update subscription');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-[#26272F]">Subscription Management</h3>
            <p className="text-xs text-gray-400">{business.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Action selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Action</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'renew', label: '✅ Renew Subscription', desc: 'Extend plan by months' },
                { value: 'extend_trial', label: '🎁 Extend Trial', desc: 'Add extra trial days' },
                { value: 'unsuspend', label: '▶️ Unsuspend Account', desc: 'Re-activate suspended account' },
                { value: 'suspend', label: '⏸ Suspend Account', desc: 'Immediately block access' },
              ].map((opt) => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${action === opt.value ? 'border-[#ff6d29] bg-orange-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="action"
                    value={opt.value}
                    checked={action === opt.value}
                    onChange={(e) => setAction(e.target.value)}
                    className="mt-0.5 text-[#ff6d29]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#26272F]">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional fields */}
          {action === 'renew' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Extend by (months)</label>
              <input
                type="number"
                min={1}
                max={24}
                value={extendMonths}
                onChange={(e) => setExtendMonths(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/30 focus:border-[#ff6d29]"
              />
            </div>
          )}
          {action === 'extend_trial' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Extra days</label>
              <input
                type="number"
                min={1}
                max={90}
                value={extraDays}
                onChange={(e) => setExtraDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/30 focus:border-[#ff6d29]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Reason or note for audit log..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/30 focus:border-[#ff6d29] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-[#ff6d29] hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Apply Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Data reset modal ───────────────────────────────────────────────────────────
const ResetModal = ({
  business,
  onClose,
}: {
  business: Business;
  onClose: () => void;
}) => {
  const [scope, setScope] = useState('all_data');
  const [confirmText, setConfirmText] = useState('');
  const [note, setNote] = useState('');
  const [resetBusiness, { isLoading }] = useResetBusinessDataMutation();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== 'RESET CONFIRM') {
      toast.error('Please type "RESET CONFIRM" to proceed');
      return;
    }
    try {
      await resetBusiness({ id: business.id, confirm_text: confirmText, reset_scope: scope, note }).unwrap();
      toast.success(`Data reset (${scope}) completed for "${business.name}"`);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Reset failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="text-base font-bold text-red-700">Reset Business Data</h3>
              <p className="text-xs text-red-500">{business.name} — Destructive action</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleReset} className="p-6 space-y-4">
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>This will permanently delete operational data. The business account, users, and settings will remain intact.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Reset Scope</label>
            <div className="space-y-2">
              {[
                { value: 'all_data', label: '🔴 All Data', desc: 'Everything — transactions, inventory, HRM, accounting' },
                { value: 'transactions_only', label: '💰 Transactions Only', desc: 'Sales, purchases, payments, ledgers' },
                { value: 'inventory_only', label: '📦 Inventory Only', desc: 'Products, stock, stock ledger' },
                { value: 'hrm_only', label: '👥 HRM Only', desc: 'Attendance, payroll, leave records' },
                { value: 'accounting_only', label: '📊 Accounting Only', desc: 'Account ledgers, transactions' },
              ].map((opt) => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${scope === opt.value ? 'border-red-400 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="scope"
                    value={opt.value}
                    checked={scope === opt.value}
                    onChange={(e) => setScope(e.target.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#26272F]">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for reset..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-red-600 mb-1.5">
              Type <span className="font-mono bg-red-50 px-1 py-0.5 rounded">RESET CONFIRM</span> to proceed
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET CONFIRM"
              className="w-full px-3 py-2.5 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 font-mono"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || confirmText !== 'RESET CONFIRM'}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Reset Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Business Detail sidebar ────────────────────────────────────────────────────
const BusinessDetailPanel = ({
  businessId,
  onClose,
  onOpenSubscription,
  onOpenReset,
  onToggle,
}: {
  businessId: string;
  onClose: () => void;
  onOpenSubscription: (b: Business) => void;
  onOpenReset: (b: Business) => void;
  onToggle: (b: Business, action: 'suspend' | 'activate') => void;
}) => {
  const { data, isLoading } = useGetBusinessDetailQuery(businessId);
  const b: Business | undefined = data?.data;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-[#26272F]">Business Detail</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#ff6d29]" />
          </div>
        ) : !b ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">Business not found</p>
          </div>
        ) : (
          <div className="p-5 space-y-5 flex-1">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <span className="text-[#ff6d29] font-black text-xl">{b.name[0]}</span>
              </div>
              <div>
                <p className="font-bold text-[#26272F] text-lg leading-tight">{b.name}</p>
                <StatusBadge status={b.status} />
              </div>
            </div>

            {/* Info grid */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Owner:</span> {b.owner}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Mobile:</span> {b.mobile || '—'}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Plan:</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{b.plan}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Joined:</span>
                {b.joinedAt ? new Date(b.joinedAt).toLocaleDateString() : '—'}
              </div>
              {b.expiresAt && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Expires:</span>
                  {new Date(b.expiresAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Usage */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{b.usersCount}</p>
                <p className="text-xs text-blue-400">Users</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-purple-600">{b.productsCount}</p>
                <p className="text-xs text-purple-400">Products</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</p>
              <button
                onClick={() => { onOpenSubscription(b); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 text-orange-400" />
                Manage Subscription
              </button>
              {b.status === 'active' ? (
                <button
                  onClick={() => { onToggle(b, 'suspend'); onClose(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 border border-red-200 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Power className="h-4 w-4" />
                  Suspend Account
                </button>
              ) : (
                <button
                  onClick={() => { onToggle(b, 'activate'); onClose(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 border border-green-200 rounded-xl text-sm text-green-600 hover:bg-green-50 transition-colors"
                >
                  <Power className="h-4 w-4" />
                  Activate Account
                </button>
              )}
              <button
                onClick={() => { onOpenReset(b); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 border border-red-100 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Business Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Row actions dropdown ───────────────────────────────────────────────────────
const RowActions = ({
  business,
  onView,
  onToggle,
  onSubscription,
  onReset,
}: {
  business: Business;
  onView: (id: string) => void;
  onToggle: (b: Business, action: 'suspend' | 'activate') => void;
  onSubscription: (b: Business) => void;
  onReset: (b: Business) => void;
}) => {
  const [open, setOpen] = useState(false);
  const isSuspended = business.status === 'suspended';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-52 bg-white border border-[#DBDFE9] rounded-xl shadow-lg py-1 overflow-hidden">
            <button
              onClick={() => { setOpen(false); onView(business.id); }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 w-full transition-colors"
            >
              <Eye className="h-4 w-4 text-blue-400" /> View Details
            </button>
            <button
              onClick={() => { setOpen(false); onSubscription(business); }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 w-full transition-colors"
            >
              <ArrowRightLeft className="h-4 w-4 text-orange-400" /> Manage Subscription
            </button>
            <button
              onClick={() => { setOpen(false); onToggle(business, isSuspended ? 'activate' : 'suspend'); }}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm w-full transition-colors ${isSuspended ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
            >
              <Power className="h-4 w-4" />
              {isSuspended ? 'Activate Account' : 'Suspend Account'}
            </button>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => { setOpen(false); onReset(business); }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
              >
                <RotateCcw className="h-4 w-4" /> Reset Data
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const BusinessesList = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const [confirmModal, setConfirmModal] = useState<{ business: Business; action: 'suspend' | 'activate' } | null>(null);
  const [subscriptionModal, setSubscriptionModal] = useState<Business | null>(null);
  const [resetModal, setResetModal] = useState<Business | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: apiData, isLoading, isFetching } = useGetAllBusinessesQuery({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const [toggleStatus, { isLoading: toggling }] = useToggleBusinessStatusMutation();

  const businesses: Business[] = apiData?.data?.businesses ?? [];
  const total: number = apiData?.data?.total ?? 0;
  const totalPages: number = apiData?.data?.totalPages ?? 1;

  const handleToggle = (business: Business, action: 'suspend' | 'activate') => {
    setConfirmModal({ business, action });
  };

  const handleConfirmToggle = async () => {
    if (!confirmModal) return;
    try {
      await toggleStatus({
        id: confirmModal.business.id,
        status: confirmModal.action === 'suspend' ? 'suspended' : 'active',
      }).unwrap();
      toast.success(
        confirmModal.action === 'suspend'
          ? `"${confirmModal.business.name}" has been suspended.`
          : `"${confirmModal.business.name}" is now active.`,
      );
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setConfirmModal(null);
    }
  };

  const inputCls =
    'w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/30 focus:border-[#ff6d29] transition-colors';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#26272F]">All Businesses</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} registered tenants on the platform</p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs font-semibold text-[#ff6d29] self-start sm:self-auto">
          <Shield className="h-3.5 w-3.5" />
          Super Admin Power
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
        {(['all', 'active', 'suspended'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${statusFilter === s ? 'bg-[#26272F] text-white border-[#26272F]' : 'bg-white text-gray-500 border-[#DBDFE9] hover:bg-gray-50'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, owner or mobile..."
            className={inputCls}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {(isLoading || isFetching) && businesses.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#DBDFE9] rounded-xl p-4 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 bg-gray-100 rounded" />
                  <div className="h-2.5 w-20 bg-gray-50 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : businesses.length === 0 ? (
          <div className="bg-white border border-[#DBDFE9] rounded-xl py-12 flex flex-col items-center gap-2">
            <Building2 className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">No businesses found</p>
          </div>
        ) : (
          businesses.map((b) => (
            <div key={b.id} className="bg-white border border-[#DBDFE9] rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#ff6d29] font-bold text-sm">{b.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#26272F]">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.owner}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.status} />
                  <RowActions business={b} onView={setDetailId} onToggle={handleToggle} onSubscription={setSubscriptionModal} onReset={setResetModal} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{b.mobile || '—'}</span>
                <span className="flex items-center gap-1"><Package className="h-3 w-3" />{b.plan} Plan</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
                  {b.joinedAt ? new Date(b.joinedAt).toLocaleDateString() : '—'}
                </span>
                <span className="flex items-center gap-1 text-gray-400">{b.usersCount} users · {b.productsCount} products</span>
              </div>
              <div className="flex gap-2">
                {b.status === 'active' && (
                  <button onClick={() => handleToggle(b, 'suspend')} className="flex-1 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                    <Power className="h-3.5 w-3.5" /> Suspend
                  </button>
                )}
                {b.status === 'suspended' && (
                  <button onClick={() => handleToggle(b, 'activate')} className="flex-1 py-2 rounded-lg border border-green-200 text-green-600 text-xs font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-1.5">
                    <Power className="h-3.5 w-3.5" /> Activate
                  </button>
                )}
                <button onClick={() => setSubscriptionModal(b)} className="flex-1 py-2 rounded-lg border border-orange-200 text-[#ff6d29] text-xs font-medium hover:bg-orange-50 transition-colors flex items-center justify-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Subscription
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-[#DBDFE9] rounded-xl overflow-hidden">
        {isLoading || isFetching ? (
          <div className="divide-y divide-gray-50 animate-pulse">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-36 bg-gray-100 rounded" />
                  <div className="h-2.5 w-24 bg-gray-50 rounded" />
                </div>
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
                <div className="h-5 w-14 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2">
            <Building2 className="h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-400">No businesses found matching your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500">Business</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">Mobile</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">Plan</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">Usage</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">Joined</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#ff6d29] font-bold text-xs">{b.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#26272F]">{b.name}</p>
                          <p className="text-xs text-gray-400">{b.owner}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{b.mobile || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.plan === 'Pro' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {b.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {b.usersCount} users · {b.productsCount} products
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {b.joinedAt ? new Date(b.joinedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === 'active' && (
                          <button
                            onClick={() => handleToggle(b, 'suspend')}
                            title="Suspend"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}
                        {b.status === 'suspended' && (
                          <button
                            onClick={() => handleToggle(b, 'activate')}
                            title="Activate"
                            className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 hover:text-green-700 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}
                        <RowActions business={b} onView={setDetailId} onToggle={handleToggle} onSubscription={setSubscriptionModal} onReset={setResetModal} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-[#26272F] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {confirmModal && (
        <ConfirmToggleModal
          business={confirmModal.business}
          action={confirmModal.action}
          onConfirm={handleConfirmToggle}
          onClose={() => setConfirmModal(null)}
          loading={toggling}
        />
      )}
      {subscriptionModal && (
        <SubscriptionModal business={subscriptionModal} onClose={() => setSubscriptionModal(null)} />
      )}
      {resetModal && (
        <ResetModal business={resetModal} onClose={() => setResetModal(null)} />
      )}
      {detailId && (
        <BusinessDetailPanel
          businessId={detailId}
          onClose={() => setDetailId(null)}
          onOpenSubscription={(b) => { setDetailId(null); setSubscriptionModal(b); }}
          onOpenReset={(b) => { setDetailId(null); setResetModal(b); }}
          onToggle={(b, action) => { setDetailId(null); setConfirmModal({ business: b, action }); }}
        />
      )}
    </div>
  );
};

export default BusinessesList;
