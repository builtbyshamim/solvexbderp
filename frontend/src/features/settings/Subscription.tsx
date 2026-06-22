import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Crown,
  Zap,
  AlertCircle,
  Building2,
  MessageCircle,
  Send,
  Phone,
  User,
  Briefcase,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  Shield,
  CreditCard,
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useFetchMeQuery } from '../../redux/api/authApi';
import {
  useGetPublicPackagesQuery,
  useSubscribeToPackageMutation,
} from '../../redux/api/packagesApi';
import type { Package } from '../../redux/api/packagesApi';
import { useGetMyPendingRequestQuery } from '../../redux/api/billingApi';
import PaymentRequestModal from '../billing/PaymentRequestModal';

const WHATSAPP_NUMBER = '8801XXXXXXXXX';

const PLAN_ICONS: Record<string, React.ElementType> = {
  Starter: Zap,
  Pro: Crown,
  Enterprise: Building2,
};

function calcYearlyDiscount(pkg: Package) {
  if (!pkg.monthlyPrice) return 0;
  return Math.round((1 - pkg.yearlyPrice / (pkg.monthlyPrice * 12)) * 100);
}
function monthlyEquiv(pkg: Package) {
  return Math.round(pkg.yearlyPrice / 12);
}
function representativeDiscount(plans: Package[]) {
  const p = plans.find((pl) => !pl.isEnterprise && pl.monthlyPrice > 0);
  return p ? calcYearlyDiscount(p) : 0;
}

// ── Billing toggle ──────────────────────────────────────────────────────────────
const BillingToggle = ({
  value,
  onChange,
  yearlySavePct,
}: {
  value: 'monthly' | 'yearly';
  onChange: (v: 'monthly' | 'yearly') => void;
  yearlySavePct: number;
}) => (
  <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl self-center">
    {(['monthly', 'yearly'] as const).map((b) => (
      <button
        key={b}
        onClick={() => onChange(b)}
        className={`relative px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
          value === b ? 'bg-white text-[#26272F] shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {b === 'monthly' ? 'Monthly' : 'Yearly'}
        {b === 'yearly' && yearlySavePct > 0 && (
          <span className="absolute -top-2.5 -right-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
            -{yearlySavePct}%
          </span>
        )}
      </button>
    ))}
  </div>
);

// ── Enterprise contact ──────────────────────────────────────────────────────────
const EnterpriseContact = () => {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', businessName: '', message: '' });

  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I am interested in SolvexBD Enterprise plan.')}`;

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        <p className="text-sm font-semibold text-[#26272F]">Request Submitted!</p>
        <p className="text-xs text-gray-400">Our team will reach out within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 mt-4">
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-sm transition-colors"
      >
        <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
      </a>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-orange-300 text-orange-600 text-sm font-medium hover:bg-orange-50 transition-colors"
      >
        <Send className="h-4 w-4" />
        Send Enquiry
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            await new Promise((r) => setTimeout(r, 800));
            setLoading(false);
            setSubmitted(true);
          }}
          className="space-y-2.5"
        >
          {[
            { name: 'name', icon: User, placeholder: 'Your Name', type: 'text' },
            { name: 'mobile', icon: Phone, placeholder: 'Mobile Number', type: 'tel' },
            { name: 'businessName', icon: Briefcase, placeholder: 'Business Name', type: 'text' },
          ].map(({ name, icon: Icon, placeholder, type }) => (
            <div key={name} className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={type}
                required
                placeholder={placeholder}
                value={(form as any)[name]}
                onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
              />
            </div>
          ))}
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea
              required
              rows={2}
              placeholder="Your requirements..."
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#ff6d29] hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && (
              <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? 'Sending...' : 'Submit Request'}
          </button>
        </form>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const Subscription = () => {
  const { t } = useLanguage();
  const { data: meData, refetch: refetchMe } = useFetchMeQuery(undefined);
  const subscription = meData?.subscription;
  const currentPlanId = subscription?.packageId ?? null;

  const { data: packagesData, isLoading: loadingPlans } = useGetPublicPackagesQuery();
  const [subscribe, { isLoading: isSubscribing }] = useSubscribeToPackageMutation();
  const { data: pendingRequest, refetch: refetchPending } = useGetMyPendingRequestQuery();

  const [billing, setBilling] = useState<'monthly' | 'yearly'>(
    (subscription?.billingCycle as 'monthly' | 'yearly') ?? 'monthly',
  );
  const [actionPlanId, setActionPlanId] = useState<string | null>(null);
  const [payPkg, setPayPkg] = useState<Package | null>(null);

  const plans: Package[] = (packagesData ?? []).filter((p) => p.isActive);
  const yearlySavePct = representativeDiscount(plans);

  const handleSubscribe = async (packageId: string) => {
    setActionPlanId(packageId);
    try {
      const result = await subscribe({ packageId, billingCycle: billing }).unwrap();
      toast.success(result.message);
      refetchMe();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to subscribe. Please try again.');
    } finally {
      setActionPlanId(null);
    }
  };

  const handleRenewOrPay = (pkg: Package) => {
    setPayPkg(pkg);
  };

  return (
    <div>
      <PageHeader
        title={t('settings.subscription.title')}
        subtitle={t('settings.subscription.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.settings') },
          { label: t('settings.subscription.title') },
        ]}
      />

      {/* ── Current Plan Banner ────────────────────────────────────────────── */}
      {subscription && (
        <div className="bg-white border border-[#DBDFE9] rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                {(() => {
                  const PlanIcon = PLAN_ICONS[subscription.plan ?? ''] ?? Shield;
                  return <PlanIcon className="h-5 w-5 text-[#ff6d29]" />;
                })()}
              </div>
              <div>
                <p
                  onClick={() => handleSubscribe(subscription.packageId)}
                  className="text-xs text-gray-400"
                >
                  Current Plan
                </p>
                <p className="font-bold text-[#26272F] capitalize">
                  {subscription.plan ?? 'No plan selected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  subscription.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : subscription.status === 'trial'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-500'
                }`}
              >
                {subscription.status}
              </span>
              {/* Renew button — shown when subscription expires soon or is expired */}
              {currentPlanId &&
                (subscription.status === 'expired' ||
                  (subscription.daysLeft !== null && subscription.daysLeft <= 7)) &&
                (() => {
                  const currentPkg = plans.find((p) => p.id === currentPlanId);
                  return currentPkg ? (
                    <button
                      onClick={() => handleRenewOrPay(currentPkg)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff6d29] hover:bg-[#e65a1f] text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <CreditCard className="h-3 w-3" />
                      Renew Now
                    </button>
                  ) : null;
                })()}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">Expires</p>
              <p className="font-medium text-[#26272F] text-sm">
                {subscription.expiresAt
                  ? new Date(subscription.expiresAt).toLocaleDateString()
                  : 'Unlimited'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Days Left</p>
              <p
                className={`font-medium text-sm ${
                  subscription.daysLeft !== null && subscription.daysLeft <= 7
                    ? 'text-red-500'
                    : 'text-[#26272F]'
                }`}
              >
                {subscription.daysLeft !== null ? `${subscription.daysLeft} days` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Billing</p>
              <p className="font-medium text-[#26272F] text-sm capitalize">
                {subscription.billingCycle ?? '—'}
              </p>
            </div>
            {subscription.package && (
              <div>
                <p className="text-xs text-gray-400">Limits</p>
                <p className="font-medium text-[#26272F] text-sm">
                  {subscription.package.maxUsers === -1
                    ? 'Unlimited'
                    : `${subscription.package.maxUsers}`}{' '}
                  users ·&nbsp;
                  {subscription.package.maxProducts === -1
                    ? 'Unlimited'
                    : subscription.package.maxProducts}{' '}
                  products
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Pending payment request banner ──────────────────────────────── */}
      {pendingRequest && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-sm">
          <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Payment Under Review</p>
            <p className="text-amber-700 mt-0.5">
              Your {pendingRequest.paymentMethod.toUpperCase()} payment (TxnID:{' '}
              <span className="font-mono font-medium">{pendingRequest.transactionId}</span>) is
              being verified. Subscription will activate once confirmed.
            </p>
          </div>
        </div>
      )}

      {/* ── Expired warning ────────────────────────────────────────────────── */}
      {subscription?.status === 'expired' && !pendingRequest && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Subscription Expired</p>
            <p className="text-red-600 mt-0.5">
              Send payment via bKash/Rocket/Nagad and click "Renew" on your plan below.
            </p>
          </div>
        </div>
      )}

      {/* ── Plan selector ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Available Plans</h3>
          <p className="text-xs text-gray-400 mt-0.5">Choose a plan that fits your business</p>
        </div>
        <BillingToggle value={billing} onChange={setBilling} yearlySavePct={yearlySavePct} />
      </div>

      {billing === 'yearly' && yearlySavePct > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-4 text-sm text-green-700">
          <TrendingUp className="h-4 w-4 flex-shrink-0" />
          <span>
            Yearly billing saves you <strong>{yearlySavePct}%</strong> — billed once per year.
          </span>
        </div>
      )}

      {loadingPlans ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#ff6d29]/20 border-t-[#ff6d29] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const Icon = PLAN_ICONS[plan.name] ?? Shield;
            const isHighlight = plan.highlight;
            const isEnterprise = plan.isEnterprise;
            const isCurrentPlan = plan.id === currentPlanId;
            const price = billing === 'monthly' ? plan.monthlyPrice : monthlyEquiv(plan);
            const discount = calcYearlyDiscount(plan);
            const isActing = isSubscribing && actionPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col border-2 rounded-2xl overflow-hidden transition-all ${
                  isCurrentPlan
                    ? 'border-[#ff6d29] shadow-md shadow-orange-100'
                    : isHighlight
                      ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-white'
                      : 'border-[#DBDFE9] bg-white hover:border-gray-300'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff6d29]" />
                )}
                {isHighlight && !isCurrentPlan && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-5 flex-1">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isEnterprise ? 'bg-orange-50' : isHighlight ? 'bg-purple-100' : 'bg-blue-50'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isEnterprise
                            ? 'text-[#ff6d29]'
                            : isHighlight
                              ? 'text-purple-500'
                              : 'text-blue-500'
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#26272F]">{plan.name}</h4>
                      {isCurrentPlan && (
                        <span className="text-[10px] font-semibold text-[#ff6d29] flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Current Plan
                        </span>
                      )}
                    </div>
                  </div>

                  {isEnterprise ? (
                    <div className="mb-4">
                      <p className="text-2xl font-black text-[#26272F]">Custom</p>
                      <p className="text-xs text-gray-400">Contact us for pricing</p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-black text-[#26272F]">
                          ৳{price.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-400 mb-1">/mo</span>
                      </div>
                      {billing === 'yearly' && discount > 0 && (
                        <p className="text-xs text-green-600 font-medium">
                          ৳{plan.yearlyPrice.toLocaleString()} billed yearly · Save {discount}%
                        </p>
                      )}
                      {billing === 'monthly' && discount > 0 && (
                        <p className="text-xs text-gray-400">
                          Save {discount}% with yearly billing
                        </p>
                      )}
                    </div>
                  )}

                  {plan.trialDays > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                      <Clock className="h-3.5 w-3.5 text-green-500" />
                      <span>{plan.trialDays}-day free trial included</span>
                    </div>
                  )}

                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isEnterprise && <EnterpriseContact />}
                </div>

                {!isEnterprise && (
                  <div className="px-5 pb-5">
                    {isCurrentPlan ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-sm font-semibold text-[#ff6d29]">
                          <CheckCircle2 className="h-4 w-4" /> Current Plan
                        </div>
                        {(subscription?.status === 'expired' ||
                          (subscription?.daysLeft !== null && subscription?.daysLeft <= 7)) && (
                          <button
                            onClick={() => handleRenewOrPay(plan)}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#ff6d29] hover:bg-[#e65a1f] text-white text-sm font-semibold transition-colors min-h-[44px]"
                          >
                            <CreditCard className="h-4 w-4" />
                            Renew {billing === 'yearly' ? '(Yearly)' : '(Monthly)'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRenewOrPay(plan)}
                        disabled={isActing}
                        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-colors min-h-[44px] disabled:opacity-60 ${
                          isHighlight
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-[#26272F] hover:bg-gray-800'
                        }`}
                      >
                        {isActing ? (
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                        {isActing
                          ? 'Opening...'
                          : currentPlanId
                            ? `Switch to ${plan.name}`
                            : plan.trialDays > 0
                              ? 'Start Free Trial'
                              : 'Get Started'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-6">
        Pay via bKash / Rocket / Nagad to <strong>01617650797</strong> · Admin verifies &amp;
        activates within hours.
      </p>

      {/* Payment request modal */}
      {payPkg && (
        <PaymentRequestModal
          isOpen={!!payPkg}
          onClose={() => setPayPkg(null)}
          pkg={payPkg}
          billingCycle={billing}
          onSuccess={() => {
            refetchPending();
            refetchMe();
          }}
        />
      )}
    </div>
  );
};

export default Subscription;
