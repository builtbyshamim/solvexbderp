import { useState } from 'react';
import { CreditCard, CheckCircle, Clock, Package, History, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { smsMarketingApi } from './smsMarketingApi';
import toast from 'react-hot-toast';

const { useGetSmsPackagesQuery, useGetSmsCreditsQuery, usePurchasePackageMutation } = smsMarketingApi;

// SMS envelope icon as inline SVG — lightweight, no extra dependency
const SmsIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <rect x="4" y="10" width="40" height="28" rx="5" fill={color} fillOpacity="0.15" />
    <rect x="4" y="10" width="40" height="28" rx="5" stroke={color} strokeWidth="2" />
    <path d="M4 16l20 13 20-13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="36" cy="34" r="6" fill={color} />
    <path d="M33 34h6M36 31v6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SmsPackages = () => {
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [activeTab, setActiveTab] = useState<'packages' | 'history'>('packages');

  const { data: packages = [], isLoading: pkgLoading } = useGetSmsPackagesQuery(undefined);
  const { data: credits, isLoading: credLoading } = useGetSmsCreditsQuery(undefined);
  const [purchase, { isLoading: isPurchasing }] = usePurchasePackageMutation();

  const selectedPkg = packages.find((p: any) => p.id === purchaseId);

  const handlePurchase = async () => {
    if (!purchaseId) return;
    try {
      await purchase({ packageId: purchaseId, paymentReference: paymentRef }).unwrap();
      toast.success('Package purchased! Credits added to your account.');
      setPurchaseId(null);
      setPaymentRef('');
    } catch {
      toast.error('Purchase failed. Please try again.');
    }
  };

  const creditHistory: any[] = credits?.history ?? [];
  const remaining = credits?.remaining ?? 0;
  const total = credits?.total ?? 0;
  const used = credits?.used ?? 0;
  const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="SMS Packages"
        subtitle="Purchase SMS credits and manage your balance"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'SMS Marketing', path: '/admin/sms-marketing' },
          { label: 'Packages' },
        ]}
      />

      {/* Credit Balance Card */}
      <div className="bg-gradient-to-r from-[#ff6d29] to-orange-500 rounded-2xl p-6 text-white mb-6 shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-orange-100 text-sm font-medium">Available Credits</p>
            <p className="text-5xl font-bold mt-1">{credLoading ? '—' : remaining.toLocaleString()}</p>
            <p className="text-orange-200 text-xs mt-1">SMS credits remaining</p>
          </div>
          <div className="flex flex-col gap-3 text-right">
            <div>
              <p className="text-orange-200 text-xs">Total Purchased</p>
              <p className="text-xl font-bold">{total.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-orange-200 text-xs">Used</p>
              <p className="text-xl font-bold">{used.toLocaleString()}</p>
            </div>
          </div>
        </div>
        {total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-orange-200 mb-1.5">
              <span>Usage</span>
              <span>{usagePercent}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${usagePercent}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {(['packages', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-white text-[#26272F] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'packages' ? (
              <span className="flex items-center gap-1.5"><Package className="h-4 w-4" /> Packages</span>
            ) : (
              <span className="flex items-center gap-1.5"><History className="h-4 w-4" /> Purchase History</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'packages' ? (
        <>
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-bold text-[#26272F]">Buy SMS</h2>
            <div className="h-px flex-1 bg-[#DBDFE9]" />
            <span className="text-xs text-gray-400 font-medium">{packages.length} packages available</span>
          </div>

          {pkgLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="bg-white border border-[#DBDFE9] rounded-xl p-4 animate-pulse">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="h-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {packages.map((pkg: any) => {
                const pkgColor = pkg.color || '#6b7280';
                const isPopular = pkg.isPopular;
                const perSms = (pkg.price / pkg.smsCount).toFixed(2);
                return (
                  <div
                    key={pkg.id}
                    className={`relative bg-white rounded-xl border-2 flex flex-col overflow-hidden transition-all hover:shadow-md group ${
                      isPopular ? 'border-[#ff6d29] shadow-sm' : 'border-[#DBDFE9] hover:border-gray-300'
                    }`}
                  >
                    {/* Popular badge */}
                    {isPopular && (
                      <div className="absolute top-0 left-0 right-0 bg-[#ff6d29] text-white text-[10px] font-bold text-center py-1 tracking-wide uppercase">
                        ★ Most Popular
                      </div>
                    )}

                    <div className={`p-4 flex-1 flex flex-col ${isPopular ? 'pt-8' : ''}`}>
                      {/* SMS Icon */}
                      <div className="mb-3">
                        <SmsIcon color={pkgColor} />
                      </div>

                      {/* Package name */}
                      <p className="font-bold text-[#26272F] text-sm leading-tight mb-0.5">{pkg.name}</p>

                      {/* SMS Count */}
                      <p className="text-2xl font-black leading-tight" style={{ color: pkgColor }}>
                        {pkg.smsCount.toLocaleString()}
                        <span className="text-xs font-normal text-gray-400 ml-1">SMS</span>
                      </p>

                      {/* Price */}
                      <p className="text-lg font-bold text-[#26272F] mt-1">
                        ৳{Number(pkg.price).toLocaleString()}
                      </p>

                      {/* Per SMS rate */}
                      <div className="mt-auto pt-2">
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                          <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                          <span>৳{perSms}/SMS</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                          <span>{pkg.validityDays}d validity</span>
                        </div>
                      </div>
                    </div>

                    {/* Buy Now button */}
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => setPurchaseId(pkg.id)}
                        className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                          isPopular
                            ? 'bg-[#ff6d29] text-white hover:bg-[#e65a1f]'
                            : 'border-2 border-gray-200 text-gray-600 hover:border-[#ff6d29] hover:text-[#ff6d29] group-hover:border-gray-300'
                        }`}
                        style={!isPopular ? {} : {}}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-3">
            <TrendingUp className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Need more than 5,000 SMS?</p>
              <p className="text-xs text-blue-600 mt-0.5">Contact us for enterprise plans with higher volumes and custom pricing tailored to your business needs.</p>
            </div>
          </div>
        </>
      ) : (
        /* Purchase History */
        <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
          {credLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-[#ff6d29] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : !creditHistory.length ? (
            <div className="p-16 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No purchase history</p>
              <p className="text-gray-400 text-sm mt-1">Your SMS package purchases will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                    {['Package', 'Credits', 'Amount Paid', 'Remaining', 'Expires', 'Date'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {creditHistory.map((c: any) => {
                    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-[#26272F]">{c.packageName || 'Custom'}</td>
                        <td className="px-4 py-3 text-gray-600">{c.totalCredits?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium text-[#26272F]">৳{Number(c.amountPaid).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${c.remainingCredits > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {c.remainingCredits?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.expiresAt ? (
                            <span className={`flex items-center gap-1 text-xs ${isExpired ? 'text-red-500' : 'text-gray-600'}`}>
                              <Clock className="h-3 w-3" />
                              {isExpired ? 'Expired' : new Date(c.expiresAt).toLocaleDateString()}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {purchaseId && selectedPkg && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-[#26272F]">Confirm Purchase</h2>
              <button onClick={() => setPurchaseId(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-5">
              {/* Package Summary */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <SmsIcon color={selectedPkg.color || '#ff6d29'} />
                  <div className="flex-1">
                    <p className="font-bold text-[#26272F] text-lg leading-tight">{selectedPkg.name}</p>
                    <p className="text-xs text-gray-500">{selectedPkg.smsCount.toLocaleString()} SMS</p>
                  </div>
                  <p className="text-2xl font-black text-[#ff6d29]">৳{Number(selectedPkg.price).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'SMS Count', value: selectedPkg.smsCount.toLocaleString() },
                    { label: 'Per SMS', value: `৳${(selectedPkg.price / selectedPkg.smsCount).toFixed(2)}` },
                    { label: 'Validity', value: `${selectedPkg.validityDays} days` },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg p-2">
                      <p className="font-bold text-[#26272F] text-sm">{item.value}</p>
                      <p className="text-[10px] text-gray-400">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Payment Reference <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Transaction ID, bKash number, etc."
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
                <p className="text-xs text-gray-400 mt-1">Contact your admin for payment details before confirming.</p>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setPurchaseId(null)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="flex items-center gap-2 px-5 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                {isPurchasing ? 'Processing...' : `Buy Now — ৳${Number(selectedPkg.price).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsPackages;
