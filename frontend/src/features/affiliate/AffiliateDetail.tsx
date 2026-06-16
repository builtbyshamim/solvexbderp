import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, DollarSign, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import {
  useGetAffiliateByIdQuery,
  useUpdateAffiliateStatusMutation,
  useUpdateCommissionRateMutation,
  useSyncReferralsMutation,
  useUpdateCommissionStatusMutation,
  useCreatePayoutMutation,
  useRecordCommissionMutation,
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
const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AffiliateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: res, isLoading } = useGetAffiliateByIdQuery(id!);
  const affiliate = res?.data ?? res;

  const [updateStatus] = useUpdateAffiliateStatusMutation();
  const [updateRate] = useUpdateCommissionRateMutation();
  const [syncReferrals] = useSyncReferralsMutation();
  const [updateCommission] = useUpdateCommissionStatusMutation();
  const [createPayout] = useCreatePayoutMutation();
  const [recordCommission] = useRecordCommissionMutation();

  const [editRate, setEditRate] = useState(false);
  const [rateValue, setRateValue] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: '', method: '', transactionRef: '', note: '' });
  const [recForm, setRecForm] = useState({ referralId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), subscriptionAmount: 500, note: '' });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!affiliate) return <div className="p-8 text-center text-gray-400">Affiliate not found</div>;

  const user = affiliate.user ?? {};

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  const handleRateSave = async () => {
    try {
      await updateRate({ id, commissionRate: +rateValue }).unwrap();
      toast.success('Rate updated');
      setEditRate(false);
    } catch { toast.error('Failed'); }
  };

  const handleSync = async () => {
    try {
      const r = await syncReferrals(id!).unwrap();
      toast.success(`Synced ${r.synced} new referrals`);
    } catch { toast.error('Sync failed'); }
  };

  const handleCommStatus = async (commId: string, status: string) => {
    try {
      await updateCommission({ id: commId, status }).unwrap();
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  const handlePayout = async () => {
    try {
      await createPayout({ affiliateId: id, ...payoutForm, amount: +payoutForm.amount }).unwrap();
      toast.success('Payout created');
      setShowPayoutModal(false);
    } catch (e: any) { toast.error(e?.data?.message ?? 'Failed'); }
  };

  const handleRecord = async () => {
    try {
      await recordCommission({ affiliateId: id, ...recForm }).unwrap();
      toast.success('Commission recorded');
      setShowRecordModal(false);
    } catch (e: any) { toast.error(e?.data?.message ?? 'Failed'); }
  };

  return (
    <div>
      <PageHeader
        title="Affiliate Detail"
        subtitle={user.name ?? user.email}
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Affiliate', path: '/admin/super-admin/affiliates' },
          { label: user.name ?? 'Detail' },
        ]}
      />

      {/* Profile card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 bg-white border border-[#DBDFE9] rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#26272F]">{user.name ?? '—'}</h3>
              <p className="text-sm text-gray-400">{user.email}</p>
              {user.mobile && <p className="text-sm text-gray-400">{user.mobile}</p>}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[affiliate.status] ?? ''}`}>
              {affiliate.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Referral Code', value: <code className="bg-gray-100 text-[#ff6d29] px-2 py-0.5 rounded font-mono text-sm">{user.referralCode ?? '—'}</code> },
              { label: 'Total Referrals', value: affiliate.referralCount ?? 0 },
              { label: 'Total Earned', value: `৳${Number(affiliate.totalEarned).toLocaleString()}` },
              { label: 'Balance', value: <span className="text-green-600 font-semibold">৳{Number(affiliate.balance).toLocaleString()}</span> },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                <p className="font-medium text-[#26272F]">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Commission rate */}
          <div className="mt-4 pt-4 border-t border-[#DBDFE9] flex items-center gap-3">
            <p className="text-sm text-gray-500">Commission Rate:</p>
            {editRate ? (
              <>
                <input
                  type="number"
                  value={rateValue}
                  onChange={e => setRateValue(e.target.value)}
                  className="w-20 border border-[#DBDFE9] rounded px-2 py-1 text-sm"
                  min={0} max={100}
                />
                <span className="text-sm text-gray-400">%</span>
                <button onClick={handleRateSave} className="text-xs text-green-600 hover:underline">Save</button>
                <button onClick={() => setEditRate(false)} className="text-xs text-gray-400 hover:underline">Cancel</button>
              </>
            ) : (
              <>
                <span className="font-semibold text-[#ff6d29]">{affiliate.commissionRate}%</span>
                <button onClick={() => { setRateValue(String(affiliate.commissionRate)); setEditRate(true); }} className="text-xs text-gray-400 hover:underline">Edit</button>
              </>
            )}
          </div>

          {/* Payment info */}
          {(affiliate.bankName || affiliate.mobileBank) && (
            <div className="mt-4 pt-4 border-t border-[#DBDFE9]">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Payment Details</p>
              {affiliate.bankName && <p className="text-sm"><span className="text-gray-400">Bank:</span> {affiliate.bankName} — {affiliate.bankAccount} ({affiliate.bankAccountName})</p>}
              {affiliate.mobileBank && <p className="text-sm"><span className="text-gray-400">{affiliate.mobileBank}:</span> {affiliate.mobileBankNumber}</p>}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-[#DBDFE9] rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-[#26272F] mb-2">Quick Actions</p>
          {affiliate.status === 'pending' && (
            <>
              <button onClick={() => handleStatusChange('active')} className="w-full py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Approve Affiliate</button>
              <button onClick={() => handleStatusChange('rejected')} className="w-full py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Reject</button>
            </>
          )}
          {affiliate.status === 'active' && (
            <>
              <button onClick={handleSync} className="w-full py-2 text-sm flex items-center justify-center gap-1.5 border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50">
                <RefreshCw className="w-4 h-4" /> Sync Referrals
              </button>
              <button onClick={() => setShowRecordModal(true)} className="w-full py-2 text-sm flex items-center justify-center gap-1.5 border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50">
                <TrendingUp className="w-4 h-4" /> Record Commission
              </button>
              <button onClick={() => setShowPayoutModal(true)} className="w-full py-2 text-sm bg-[#ff6d29] text-white rounded-lg hover:bg-[#e55f20] flex items-center justify-center gap-1.5">
                <DollarSign className="w-4 h-4" /> Create Payout
              </button>
              <button onClick={() => handleStatusChange('inactive')} className="w-full py-2 text-sm text-gray-500 hover:underline">Deactivate</button>
            </>
          )}
          {affiliate.status === 'inactive' && (
            <button onClick={() => handleStatusChange('active')} className="w-full py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Activate</button>
          )}
        </div>
      </div>

      {/* Referrals */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl mb-5">
        <div className="px-5 py-3 border-b border-[#DBDFE9]">
          <h4 className="text-sm font-semibold text-[#26272F]">Referrals ({affiliate.referralCount ?? 0})</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">User ID</th>
                <th className="px-4 py-3 text-left">Monthly Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(affiliate.referrals ?? []).map((r: any) => (
                <tr key={r.id} className="border-t border-[#DBDFE9] hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.referredUserId}</td>
                  <td className="px-4 py-3">৳{Number(r.monthlySubscriptionAmount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(affiliate.referrals ?? []).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">No referrals yet. Click "Sync Referrals" to detect existing ones.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commissions */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl mb-5">
        <div className="px-5 py-3 border-b border-[#DBDFE9]">
          <h4 className="text-sm font-semibold text-[#26272F]">Commissions</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                {['Period', 'Subscription', 'Rate', 'Commission', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(affiliate.commissions ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-[#DBDFE9] hover:bg-gray-50">
                  <td className="px-4 py-3">{months[c.month]} {c.year}</td>
                  <td className="px-4 py-3">৳{Number(c.subscriptionAmount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{c.commissionRate}%</td>
                  <td className="px-4 py-3 font-semibold text-green-600">৳{Number(c.commissionAmount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${COMM_BADGE[c.status] ?? ''}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {c.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleCommStatus(c.id, 'approved')} className="text-xs text-green-600 hover:underline">Approve</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => handleCommStatus(c.id, 'cancelled')} className="text-xs text-red-500 hover:underline">Cancel</button>
                      </div>
                    )}
                    {c.status === 'approved' && (
                      <button onClick={() => handleCommStatus(c.id, 'paid')} className="text-xs text-[#ff6d29] hover:underline">Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
              {(affiliate.commissions ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">No commissions recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payouts */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl">
        <div className="px-5 py-3 border-b border-[#DBDFE9]">
          <h4 className="text-sm font-semibold text-[#26272F]">Payout History</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                {['Amount', 'Method', 'Ref', 'Note', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(affiliate.payouts ?? []).map((p: any) => (
                <tr key={p.id} className="border-t border-[#DBDFE9] hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-[#ff6d29]">৳{Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">{p.method ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.transactionRef ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.note ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(affiliate.payouts ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">No payouts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-base font-semibold mb-1">Create Payout</h3>
            <p className="text-xs text-gray-400 mb-4">Balance: <span className="text-green-600 font-semibold">৳{Number(affiliate.balance).toLocaleString()}</span></p>
            <div className="space-y-3">
              {[
                { label: 'Amount (৳) *', key: 'amount', type: 'number' },
                { label: 'Transaction Reference', key: 'transactionRef', type: 'text' },
                { label: 'Note', key: 'note', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type} value={(payoutForm as any)[f.key]} onChange={e => setPayoutForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                <select value={payoutForm.method} onChange={e => setPayoutForm(p => ({ ...p, method: e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {['bank','bkash','nagad','rocket','cash'].map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowPayoutModal(false)} className="px-4 py-2 text-sm border border-[#DBDFE9] rounded-lg text-gray-600">Cancel</button>
              <button onClick={handlePayout} className="px-4 py-2 text-sm bg-[#ff6d29] text-white rounded-lg">Process</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Commission Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-base font-semibold mb-4">Record Commission</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Referral ID *</label>
                <select value={recForm.referralId} onChange={e => setRecForm(p => ({ ...p, referralId: e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm">
                  <option value="">Select referral</option>
                  {(affiliate.referrals ?? []).map((r: any) => (
                    <option key={r.id} value={r.id}>{r.referredUserId.slice(0, 8)}…</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                  <select value={recForm.month} onChange={e => setRecForm(p => ({ ...p, month: +e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm">
                    {months.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <input type="number" value={recForm.year} onChange={e => setRecForm(p => ({ ...p, year: +e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subscription Amount (৳)</label>
                <input type="number" value={recForm.subscriptionAmount} onChange={e => setRecForm(p => ({ ...p, subscriptionAmount: +e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm" />
                <p className="text-xs text-gray-400 mt-1">Commission: ৳{(recForm.subscriptionAmount * Number(affiliate.commissionRate) / 100).toFixed(0)} ({affiliate.commissionRate}%)</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                <input type="text" value={recForm.note} onChange={e => setRecForm(p => ({ ...p, note: e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowRecordModal(false)} className="px-4 py-2 text-sm border border-[#DBDFE9] rounded-lg text-gray-600">Cancel</button>
              <button onClick={handleRecord} className="px-4 py-2 text-sm bg-[#ff6d29] text-white rounded-lg">Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
