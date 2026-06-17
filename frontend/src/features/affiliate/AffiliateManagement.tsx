import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, TrendingUp, DollarSign, Clock, CheckCircle,
  Search, ChevronRight, RefreshCw,
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import {
  useGetAffiliateStatsQuery,
  useGetAllAffiliatesQuery,
  useUpdateAffiliateStatusMutation,
  useGenerateMonthlyCommissionsMutation,
  useGetAllCommissionsQuery,
  useUpdateCommissionStatusMutation,
  useGetAllPayoutsQuery,
  useCreatePayoutMutation,
  useSyncReferralsMutation,
} from './affiliateApi';
import toast from 'react-hot-toast';

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-100 text-red-500',
};

const COMM_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  approved:  'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
};

const months = ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AffiliateManagement() {
  const [tab, setTab] = useState<'affiliates' | 'commissions' | 'payouts'>('affiliates');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showGenModal, setShowGenModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [genForm, setGenForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), subscriptionAmount: 500, note: '' });
  const [payoutForm, setPayoutForm] = useState({ amount: '', method: '', transactionRef: '', note: '' });

  const { data: stats } = useGetAffiliateStatsQuery({});
  const { data: affiliatesData, isLoading } = useGetAllAffiliatesQuery({ search, status: statusFilter, limit: 50 });
  const { data: commissionsData } = useGetAllCommissionsQuery({ limit: 100 });
  const { data: payoutsData } = useGetAllPayoutsQuery({ limit: 100 });

  const [updateStatus] = useUpdateAffiliateStatusMutation();
  const [generateMonthly] = useGenerateMonthlyCommissionsMutation();
  const [updateCommission] = useUpdateCommissionStatusMutation();
  const [createPayout] = useCreatePayoutMutation();
  const [syncReferrals] = useSyncReferralsMutation();

  const s = stats?.data ?? stats ?? {};

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleSync = async (id: string) => {
    try {
      const res = await syncReferrals(id).unwrap();
      toast.success(`Synced ${res.synced ?? 0} new referrals`);
    } catch {
      toast.error('Sync failed');
    }
  };

  const handleGenerateMonthly = async () => {
    try {
      const res = await generateMonthly(genForm).unwrap();
      toast.success(`Created ${res.created} commissions, skipped ${res.skipped}`);
      setShowGenModal(false);
    } catch {
      toast.error('Generation failed');
    }
  };

  const handleCommissionStatus = async (id: string, status: string) => {
    try {
      await updateCommission({ id, status }).unwrap();
      toast.success('Commission updated');
    } catch {
      toast.error('Failed');
    }
  };

  const handlePayout = async () => {
    if (!selectedAffiliate) return;
    try {
      await createPayout({ affiliateId: selectedAffiliate.id, ...payoutForm, amount: +payoutForm.amount }).unwrap();
      toast.success('Payout created');
      setShowPayoutModal(false);
      setPayoutForm({ amount: '', method: '', transactionRef: '', note: '' });
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Payout failed');
    }
  };

  const affiliates = affiliatesData?.data ?? [];
  const commissions = commissionsData?.data ?? [];
  const payouts = payoutsData?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Affiliate Management"
        subtitle="Manage affiliates, commissions, and payouts"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Affiliate' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Affiliates', value: s.totalAffiliates ?? 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Active', value: s.activeAffiliates ?? 0, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Pending', value: s.pendingApplications ?? 0, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Total Referrals', value: s.totalReferrals ?? 0, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
            <div className={`w-9 h-9 rounded-lg ${c.color} flex items-center justify-center mb-2`}>
              <c.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-[#26272F]">{c.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending Commissions', value: `৳${Number(s.pendingCommissionAmount ?? 0).toLocaleString()}`, color: 'text-yellow-600' },
          { label: 'Approved Commissions', value: `৳${Number(s.approvedCommissionAmount ?? 0).toLocaleString()}`, color: 'text-blue-600' },
          { label: 'Total Paid Out', value: `৳${Number(s.totalPaidOut ?? 0).toLocaleString()}`, color: 'text-green-600' },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-[#DBDFE9] rounded-lg p-4 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-gray-300" />
            <div>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-gray-400">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg">
        <div className="flex border-b border-[#DBDFE9]">
          {(['affiliates', 'commissions', 'payouts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'border-b-2 border-[#ff6d29] text-[#ff6d29]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2 px-4">
            {tab === 'commissions' && (
              <button
                onClick={() => setShowGenModal(true)}
                className="flex items-center gap-1.5 bg-[#ff6d29] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#e55f20]"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Generate Monthly
              </button>
            )}
          </div>
        </div>

        {/* Affiliates Tab */}
        {tab === 'affiliates' && (
          <div>
            <div className="p-4 flex gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[#DBDFE9] rounded-lg focus:outline-none focus:border-[#ff6d29]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-[#DBDFE9] rounded-lg px-3 py-2 focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-[#DBDFE9] bg-gray-50 text-xs text-gray-500 uppercase">
                    {['Affiliate', 'Referral Code', 'Rate', 'Balance', 'Earned', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((a: any) => (
                    <tr key={a.id} className="border-t border-[#DBDFE9] hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#26272F]">{a.user?.name ?? a.user?.email}</p>
                        <p className="text-xs text-gray-400">{a.user?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <code className="bg-gray-100 text-[#ff6d29] text-xs px-2 py-0.5 rounded font-mono">
                          {a.user?.referralCode ?? '—'}
                        </code>
                      </td>
                      <td className="px-4 py-3 font-medium">{a.commissionRate}%</td>
                      <td className="px-4 py-3 font-semibold text-green-600">৳{Number(a.balance).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500">৳{Number(a.totalEarned).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[a.status] ?? ''}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {a.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatusChange(a.id, 'active')} className="text-xs text-green-600 hover:underline">Approve</button>
                              <span className="text-gray-300">|</span>
                              <button onClick={() => handleStatusChange(a.id, 'rejected')} className="text-xs text-red-500 hover:underline">Reject</button>
                            </>
                          )}
                          {a.status === 'active' && (
                            <>
                              <button onClick={() => handleStatusChange(a.id, 'inactive')} className="text-xs text-gray-500 hover:underline">Deactivate</button>
                              <span className="text-gray-300">|</span>
                              <button onClick={() => handleSync(a.id)} className="text-xs text-blue-500 hover:underline flex items-center gap-0.5"><RefreshCw className="w-3 h-3" />Sync</button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => { setSelectedAffiliate(a); setShowPayoutModal(true); }}
                                className="text-xs text-[#ff6d29] hover:underline"
                              >
                                Payout
                              </button>
                            </>
                          )}
                          {a.status === 'inactive' && (
                            <button onClick={() => handleStatusChange(a.id, 'active')} className="text-xs text-green-600 hover:underline">Activate</button>
                          )}
                          <span className="text-gray-300">|</span>
                          <Link to={`/admin/super-admin/affiliates/${a.id}`} className="text-xs text-gray-500 hover:underline flex items-center gap-0.5">
                            Detail <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && affiliates.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No affiliates found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Commissions Tab */}
        {tab === 'commissions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-[#DBDFE9] bg-gray-50 text-xs text-gray-500 uppercase">
                  {['Affiliate', 'Period', 'Subscription', 'Commission', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map((c: any) => (
                  <tr key={c.id} className="border-t border-[#DBDFE9] hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.affiliate?.user?.name ?? c.affiliate?.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{months[c.month]} {c.year}</td>
                    <td className="px-4 py-3">৳{Number(c.subscriptionAmount).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      ৳{Number(c.commissionAmount).toLocaleString()}
                      <span className="text-xs text-gray-400 ml-1">({c.commissionRate}%)</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${COMM_BADGE[c.status] ?? ''}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {c.status === 'pending' && (
                          <>
                            <button onClick={() => handleCommissionStatus(c.id, 'approved')} className="text-xs text-green-600 hover:underline">Approve</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => handleCommissionStatus(c.id, 'cancelled')} className="text-xs text-red-500 hover:underline">Cancel</button>
                          </>
                        )}
                        {c.status === 'approved' && (
                          <button onClick={() => handleCommissionStatus(c.id, 'paid')} className="text-xs text-[#ff6d29] hover:underline">Mark Paid</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {commissions.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No commissions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Payouts Tab */}
        {tab === 'payouts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-[#DBDFE9] bg-gray-50 text-xs text-gray-500 uppercase">
                  {['Affiliate', 'Amount', 'Method', 'Transaction Ref', 'Note', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p: any) => (
                  <tr key={p.id} className="border-t border-[#DBDFE9] hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.affiliate?.user?.name ?? p.affiliate?.user?.email}</td>
                    <td className="px-4 py-3 font-semibold text-[#ff6d29]">৳{Number(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 capitalize text-gray-500">{p.method ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.transactionRef ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.note ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No payouts yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Monthly Commissions Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-base font-semibold text-[#26272F] mb-4">Generate Monthly Commissions</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                  <select
                    value={genForm.month}
                    onChange={(e) => setGenForm(p => ({ ...p, month: +e.target.value }))}
                    className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm"
                  >
                    {months.slice(1).map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <input
                    type="number"
                    value={genForm.year}
                    onChange={(e) => setGenForm(p => ({ ...p, year: +e.target.value }))}
                    className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subscription Amount (৳)</label>
                <input
                  type="number"
                  value={genForm.subscriptionAmount}
                  onChange={(e) => setGenForm(p => ({ ...p, subscriptionAmount: +e.target.value }))}
                  className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">10% commission = ৳{(genForm.subscriptionAmount * 0.1).toFixed(0)} per referral</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={genForm.note}
                  onChange={(e) => setGenForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., June 2025 subscription renewal"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowGenModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-[#DBDFE9] rounded-lg">Cancel</button>
              <button onClick={handleGenerateMonthly} className="px-4 py-2 text-sm bg-[#ff6d29] text-white rounded-lg hover:bg-[#e55f20]">Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-base font-semibold text-[#26272F] mb-1">Create Payout</h3>
            <p className="text-xs text-gray-400 mb-4">
              Affiliate: <span className="font-medium text-[#26272F]">{selectedAffiliate.user?.name}</span>
              &nbsp;| Balance: <span className="font-semibold text-green-600">৳{Number(selectedAffiliate.balance).toLocaleString()}</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount (৳) *</label>
                <input
                  type="number"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm"
                  max={Number(selectedAffiliate.balance)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                <select
                  value={payoutForm.method}
                  onChange={(e) => setPayoutForm(p => ({ ...p, method: e.target.value }))}
                  className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select method</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={payoutForm.transactionRef}
                  onChange={(e) => setPayoutForm(p => ({ ...p, transactionRef: e.target.value }))}
                  className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm"
                  placeholder="TXN ID or reference number"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                <input
                  type="text"
                  value={payoutForm.note}
                  onChange={(e) => setPayoutForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowPayoutModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-[#DBDFE9] rounded-lg">Cancel</button>
              <button onClick={handlePayout} className="px-4 py-2 text-sm bg-[#ff6d29] text-white rounded-lg hover:bg-[#e55f20]">Process Payout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
