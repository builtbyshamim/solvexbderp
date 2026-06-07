import { useState } from 'react';
import {
  Search,
  Building2,
  Filter,
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetAllBusinessesQuery, useToggleBusinessStatusMutation } from '../../redux/api/superAdminApi';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Business {
  id: string;
  name: string;
  owner: string;
  mobile: string;
  plan: string;
  status: 'active' | 'trial' | 'expired' | 'suspended';
  joinedAt: string;
  expiresAt: string;
  usersCount: number;
  productsCount: number;
}

// ── Mock data (replace when API is ready) ──────────────────────────────────────
const MOCK: Business[] = [
  { id: '1', name: 'Rahman Traders', owner: 'Abdul Rahman', mobile: '01711000001', plan: 'Pro', status: 'active', joinedAt: '2025-01-15', expiresAt: '2026-01-15', usersCount: 12, productsCount: 340 },
  { id: '2', name: 'Karim Store', owner: 'Karim Uddin', mobile: '01811000002', plan: 'Starter', status: 'trial', joinedAt: '2025-06-01', expiresAt: '2025-06-16', usersCount: 1, productsCount: 45 },
  { id: '3', name: 'Dhaka Mart', owner: 'Nasrin Begum', mobile: '01911000003', plan: 'Pro', status: 'active', joinedAt: '2024-11-10', expiresAt: '2025-11-10', usersCount: 18, productsCount: 812 },
  { id: '4', name: 'City Electronics', owner: 'Hasan Ali', mobile: '01611000004', plan: 'Starter', status: 'expired', joinedAt: '2024-03-10', expiresAt: '2025-03-10', usersCount: 2, productsCount: 120 },
  { id: '5', name: 'Green Pharmacy', owner: 'Sumaiya Islam', mobile: '01511000005', plan: 'Starter', status: 'suspended', joinedAt: '2025-01-22', expiresAt: '2025-07-22', usersCount: 3, productsCount: 220 },
  { id: '6', name: 'Star Fashions', owner: 'Raihan Hossain', mobile: '01711000006', plan: 'Pro', status: 'active', joinedAt: '2025-02-14', expiresAt: '2026-02-14', usersCount: 21, productsCount: 630 },
  { id: '7', name: 'Metro Grocers', owner: 'Farzana Akter', mobile: '01811000007', plan: 'Starter', status: 'active', joinedAt: '2025-04-01', expiresAt: '2026-04-01', usersCount: 3, productsCount: 178 },
  { id: '8', name: 'Horizon Tech', owner: 'Md. Tanvir', mobile: '01911000008', plan: 'Pro', status: 'trial', joinedAt: '2025-05-28', expiresAt: '2025-06-12', usersCount: 4, productsCount: 60 },
];

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

// ── Confirm dialog ─────────────────────────────────────────────────────────────
const ConfirmModal = ({
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
        {action === 'suspend' ? (
          <XCircle className="h-6 w-6 text-red-500" />
        ) : (
          <CheckCircle className="h-6 w-6 text-green-500" />
        )}
      </div>
      <h3 className="text-base font-bold text-center text-[#26272F] mb-1">
        {action === 'suspend' ? 'Suspend Business?' : 'Activate Business?'}
      </h3>
      <p className="text-sm text-gray-500 text-center mb-5">
        {action === 'suspend'
          ? `All users of "${business.name}" will immediately lose access. Their data will be preserved.`
          : `"${business.name}" will regain full access to their account.`}
      </p>

      {action === 'suspend' && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-xs text-amber-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          This action is reversible. You can reactivate the account at any time.
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${
            action === 'suspend' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {loading && <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {action === 'suspend' ? 'Yes, Suspend' : 'Yes, Activate'}
        </button>
      </div>
    </div>
  </div>
);

// ── Row actions dropdown ───────────────────────────────────────────────────────
const RowActions = ({
  business,
  onToggle,
}: {
  business: Business;
  onToggle: (b: Business, action: 'suspend' | 'activate') => void;
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
          <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-[#DBDFE9] rounded-xl shadow-lg py-1 overflow-hidden">
            <button
              onClick={() => { setOpen(false); }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 w-full transition-colors"
            >
              <Eye className="h-4 w-4 text-blue-400" /> View Details
            </button>
            <button
              onClick={() => { setOpen(false); onToggle(business, isSuspended ? 'activate' : 'suspend'); }}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm w-full transition-colors ${
                isSuspended
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-red-500 hover:bg-red-50'
              }`}
            >
              <Power className="h-4 w-4" />
              {isSuspended ? 'Activate Account' : 'Suspend Account'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 w-full transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-orange-400" /> Renew Subscription
            </button>
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

  const [confirmModal, setConfirmModal] = useState<{
    business: Business;
    action: 'suspend' | 'activate';
  } | null>(null);

  const { data: apiData } = useGetAllBusinessesQuery({ search, status: statusFilter, page, limit: PAGE_SIZE });
  const [toggleStatus, { isLoading: togglingId }] = useToggleBusinessStatusMutation();

  // Use mock until API is wired
  const allData: Business[] = apiData?.data?.businesses ?? MOCK;

  const filtered = allData.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.owner.toLowerCase().includes(search.toLowerCase()) ||
      b.mobile.includes(search);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggle = (business: Business, action: 'suspend' | 'activate') => {
    setConfirmModal({ business, action });
  };

  const handleConfirm = async () => {
    if (!confirmModal) return;
    try {
      const newStatus = confirmModal.action === 'suspend' ? 'suspended' : 'active';
      await toggleStatus({ id: confirmModal.business.id, status: newStatus }).unwrap();
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

  const counts = {
    all: allData.length,
    active: allData.filter((b) => b.status === 'active').length,
    trial: allData.filter((b) => b.status === 'trial').length,
    expired: allData.filter((b) => b.status === 'expired').length,
    suspended: allData.filter((b) => b.status === 'suspended').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#26272F]">All Businesses</h1>
          <p className="text-sm text-gray-400 mt-0.5">{allData.length} registered tenants on the platform</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs font-semibold text-[#ff6d29]">
            <Shield className="h-3.5 w-3.5" />
            Super Admin Power
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
        {(['all', 'active', 'trial', 'expired', 'suspended'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              statusFilter === s
                ? 'bg-[#26272F] text-white border-[#26272F]'
                : 'bg-white text-gray-500 border-[#DBDFE9] hover:bg-gray-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === s ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, owner or mobile..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/30 focus:border-[#ff6d29] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {paginated.length === 0 && (
          <div className="bg-white border border-[#DBDFE9] rounded-xl py-12 flex flex-col items-center gap-2">
            <Building2 className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">No businesses found</p>
          </div>
        )}
        {paginated.map((b) => (
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
                <RowActions business={b} onToggle={handleToggle} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{b.mobile}</span>
              <span className="flex items-center gap-1"><Package className="h-3 w-3" />{b.plan} Plan</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
                Joined {new Date(b.joinedAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1 text-gray-400">
                {b.usersCount} users · {b.productsCount} products</span>
            </div>
            {b.status === 'active' && (
              <button
                onClick={() => handleToggle(b, 'suspend')}
                className="w-full py-2 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Power className="h-3.5 w-3.5" /> Suspend This Shop
              </button>
            )}
            {b.status === 'suspended' && (
              <button
                onClick={() => handleToggle(b, 'activate')}
                className="w-full py-2 rounded-lg border border-green-200 text-green-600 text-xs font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Power className="h-3.5 w-3.5" /> Reactivate Shop
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-[#DBDFE9] rounded-xl overflow-hidden">
        {paginated.length === 0 ? (
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
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500">Expires</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((b) => (
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
                    <td className="px-4 py-3.5 text-gray-500">{b.mobile}</td>
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
                      {new Date(b.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {new Date(b.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick suspend/activate */}
                        {b.status === 'active' && (
                          <button
                            onClick={() => handleToggle(b, 'suspend')}
                            title="Suspend shop"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}
                        {b.status === 'suspended' && (
                          <button
                            onClick={() => handleToggle(b, 'activate')}
                            title="Activate shop"
                            className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 hover:text-green-700 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}
                        <RowActions business={b} onToggle={handleToggle} />
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
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                    p === page
                      ? 'bg-[#26272F] text-white'
                      : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
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

      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          business={confirmModal.business}
          action={confirmModal.action}
          onConfirm={handleConfirm}
          onClose={() => setConfirmModal(null)}
          loading={!!togglingId}
        />
      )}
    </div>
  );
};

export default BusinessesList;
