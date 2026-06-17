import { useState } from 'react';
import { Copy, Check, TrendingUp, Users, DollarSign, Clock, Gift } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import {
  useGetMyAffiliateQuery,
  useGetMyReferralsQuery,
  useGetMyCommissionsQuery,
  useApplyAffiliateMutation,
} from './affiliateApi';
import toast from 'react-hot-toast';

const COMM_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  approved:  'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
};
const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function MyAffiliate() {
  const { data: res, isLoading } = useGetMyAffiliateQuery({});
  const affiliate = res?.data ?? res;
  const { data: referralsRes } = useGetMyReferralsQuery({}, { skip: !affiliate });
  const { data: commissionsRes } = useGetMyCommissionsQuery({}, { skip: !affiliate });

  const [applyAffiliate] = useApplyAffiliateMutation();
  const [copied, setCopied] = useState(false);
  const [applyForm, setApplyForm] = useState({
    mobileBank: '', mobileBankNumber: '', bankName: '', bankAccount: '', bankAccountName: '', notes: '',
  });
  const [showApplyForm, setShowApplyForm] = useState(false);

  const referralCode = affiliate?.referralCode ?? '';
  const referralLink = `${window.location.origin}/login?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    try {
      await applyAffiliate(applyForm).unwrap();
      toast.success('Application submitted! Await admin approval.');
      setShowApplyForm(false);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to apply');
    }
  };

  const referrals = referralsRes?.data ?? [];
  const commissions = commissionsRes?.data ?? [];

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title="My Affiliate"
        subtitle="Earn 10% commission for every referred business"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Settings' },
          { label: 'My Affiliate' },
        ]}
      />

      {/* Not applied yet */}
      {!affiliate && (
        <div className="bg-white border border-[#DBDFE9] rounded-xl p-8 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-[#ff6d29]" />
          </div>
          <h3 className="text-lg font-semibold text-[#26272F] mb-2">Join the Affiliate Program</h3>
          <p className="text-sm text-gray-500 mb-6">
            Earn <span className="font-semibold text-[#ff6d29]">10% commission per month</span> for every business you refer to SolvexBD ERP.
            Share your unique referral link and get paid monthly.
          </p>
          {!showApplyForm ? (
            <button
              onClick={() => setShowApplyForm(true)}
              className="bg-[#ff6d29] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#e55f20]"
            >
              Apply Now
            </button>
          ) : (
            <div className="text-left space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Payment Details (optional but recommended)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mobile Banking (bKash/Nagad)</label>
                  <select value={applyForm.mobileBank} onChange={e => setApplyForm(p => ({ ...p, mobileBank: e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm">
                    <option value="">Select</option>
                    {['bKash','Nagad','Rocket'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mobile Number</label>
                  <input type="text" value={applyForm.mobileBankNumber} onChange={e => setApplyForm(p => ({ ...p, mobileBankNumber: e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm" placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bank Name</label>
                  <input type="text" value={applyForm.bankName} onChange={e => setApplyForm(p => ({ ...p, bankName: e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Account Number</label>
                  <input type="text" value={applyForm.bankAccount} onChange={e => setApplyForm(p => ({ ...p, bankAccount: e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Account Name</label>
                <input type="text" value={applyForm.bankAccountName} onChange={e => setApplyForm(p => ({ ...p, bankAccountName: e.target.value }))} className="w-full border border-[#DBDFE9] rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowApplyForm(false)} className="flex-1 py-2 text-sm border border-[#DBDFE9] rounded-lg text-gray-600">Cancel</button>
                <button onClick={handleApply} className="flex-1 py-2 text-sm bg-[#ff6d29] text-white rounded-lg hover:bg-[#e55f20]">Submit Application</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending/Rejected */}
      {affiliate && affiliate.status !== 'active' && (
        <div className={`border rounded-xl p-6 mb-6 ${
          affiliate.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
          affiliate.status === 'rejected' ? 'bg-red-50 border-red-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-semibold text-[#26272F]">
                {affiliate.status === 'pending' ? 'Application Under Review' :
                 affiliate.status === 'rejected' ? 'Application Rejected' : 'Account Inactive'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {affiliate.status === 'pending' ? 'Your affiliate application is being reviewed by admin. You will be notified once approved.' :
                 affiliate.status === 'rejected' ? 'Your application was not approved. Contact support for more information.' :
                 'Your affiliate account has been deactivated. Contact admin to re-enable.'}
              </p>
              {affiliate.notes && <p className="text-xs text-gray-500 mt-1">Note: {affiliate.notes}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Active affiliate */}
      {affiliate?.status === 'active' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Commission Rate', value: `${affiliate.commissionRate}%`, icon: TrendingUp, color: 'bg-orange-50 text-[#ff6d29]' },
              { label: 'Total Referrals', value: affiliate.referralCount ?? referrals.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
              { label: 'Total Earned', value: `৳${Number(affiliate.totalEarned).toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
              { label: 'Available Balance', value: `৳${Number(affiliate.balance).toLocaleString()}`, icon: DollarSign, color: 'bg-purple-50 text-purple-600' },
            ].map(c => (
              <div key={c.label} className="bg-white border border-[#DBDFE9] rounded-xl p-4">
                <div className={`w-9 h-9 rounded-lg ${c.color} flex items-center justify-center mb-2`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <p className="text-xl font-bold text-[#26272F]">{c.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Referral link */}
          <div className="bg-gradient-to-r from-[#ff6d29] to-[#ff8d57] rounded-xl p-5 mb-6 text-white">
            <h3 className="text-sm font-semibold mb-1">Your Referral Link</h3>
            <p className="text-xs opacity-80 mb-3">Share this link. When someone signs up, you earn 10% of their monthly subscription.</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/20 rounded-lg px-3 py-2 text-sm font-mono truncate">
                {referralLink}
              </div>
              <button
                onClick={copyLink}
                className="bg-white text-[#ff6d29] px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-orange-50 flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-4">
              <div className="text-xs opacity-80">Referral Code: <span className="font-mono font-semibold bg-white/20 px-1.5 py-0.5 rounded">{referralCode}</span></div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white border border-[#DBDFE9] rounded-xl p-5 mb-6">
            <h4 className="text-sm font-semibold text-[#26272F] mb-3">How It Works</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Share Your Link', desc: 'Share your unique referral link with businesses.' },
                { step: '2', title: 'They Subscribe', desc: 'When they subscribe to any plan, you earn 10% monthly.' },
                { step: '3', title: 'Get Paid', desc: 'Admin approves and processes your commission each month.' },
              ].map(s => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#ff6d29] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
                  <div>
                    <p className="text-sm font-medium text-[#26272F]">{s.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referrals table */}
          <div className="bg-white border border-[#DBDFE9] rounded-xl mb-5">
            <div className="px-5 py-3 border-b border-[#DBDFE9]">
              <h4 className="text-sm font-semibold text-[#26272F]">My Referrals ({referrals.length})</h4>
            </div>
            {referrals.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No referrals yet. Share your link to get started!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r: any, i: number) => (
                      <tr key={r.id} className="border-t border-[#DBDFE9]">
                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Commissions */}
          <div className="bg-white border border-[#DBDFE9] rounded-xl">
            <div className="px-5 py-3 border-b border-[#DBDFE9]">
              <h4 className="text-sm font-semibold text-[#26272F]">Commission History</h4>
            </div>
            {commissions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No commissions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                      {['Period', 'Subscription', 'Commission', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c: any) => (
                      <tr key={c.id} className="border-t border-[#DBDFE9] hover:bg-gray-50">
                        <td className="px-4 py-3">{months[c.month]} {c.year}</td>
                        <td className="px-4 py-3">৳{Number(c.subscriptionAmount).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-green-600">৳{Number(c.commissionAmount).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${COMM_BADGE[c.status] ?? ''}`}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
