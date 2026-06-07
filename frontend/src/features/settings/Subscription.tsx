import { useState } from 'react';
import {
  CheckCircle2, Crown, Zap, AlertCircle, Building2,
  MessageCircle, Send, Phone, User, Briefcase, MessageSquare,
  ChevronDown, ChevronUp, TrendingUp, Clock, Shield,
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useFetchMeQuery } from '../../redux/api/authApi';
import { MOCK_PACKAGES, yearlyDiscount, monthlyEquivalent, representativeYearlyDiscount } from '../../data/mockPackages';
import type { Package } from '../../redux/api/packagesApi';

const WHATSAPP_NUMBER = '8801XXXXXXXXX';

const PLAN_ICONS: Record<string, React.ElementType> = {
  Starter: Zap, Pro: Crown, Enterprise: Building2,
};

// ── Billing toggle ─────────────────────────────────────────────────────────────
const BillingToggle = ({
  value,
  onChange,
}: {
  value: 'monthly' | 'yearly';
  onChange: (v: 'monthly' | 'yearly') => void;
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
        {b === 'yearly' && (
          <span className="absolute -top-2.5 -right-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
            -{yearlySavePct}%
          </span>
        )}
      </button>
    ))}
  </div>
);

// ── Enterprise contact ──────────────────────────────────────────────────────────
const EnterpriseContact = ({ dark }: { dark?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', businessName: '', message: '' });

  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I am interested in BizCore Enterprise plan.')}`;

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
      <a href={wa} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-sm transition-colors">
        <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
      </a>
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-orange-300 text-orange-600 text-sm font-medium hover:bg-orange-50 transition-colors">
        <Send className="h-4 w-4" />
        Send Enquiry
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <form onSubmit={async (e) => { e.preventDefault(); setLoading(true); await new Promise(r => setTimeout(r, 800)); setLoading(false); setSubmitted(true); }}
          className="space-y-2.5">
          {[
            { name: 'name', icon: User, placeholder: 'Your Name', type: 'text' },
            { name: 'mobile', icon: Phone, placeholder: 'Mobile Number', type: 'tel' },
            { name: 'businessName', icon: Briefcase, placeholder: 'Business Name', type: 'text' },
          ].map(({ name, icon: Icon, placeholder, type }) => (
            <div key={name} className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type={type} required placeholder={placeholder}
                value={(form as any)[name]}
                onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent" />
            </div>
          ))}
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea required rows={2} placeholder="Your requirements..."
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#ff6d29] hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
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
  const { data: meData } = useFetchMeQuery();
  const business = meData?.data?.business;
  const subscription = business?.subscription;

  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const plans: Package[] = MOCK_PACKAGES.filter((p) => p.isActive);
  const yearlySavePct = representativeYearlyDiscount(plans);

  const activePlanName = subscription?.plan?.name?.toLowerCase() ?? '';

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

      {/* ── Current Plan Banner ───────────────────────────────────────────── */}
      {subscription && (
        <div className="bg-white border border-[#DBDFE9] rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                {(() => {
                  const PlanIcon = PLAN_ICONS[subscription.plan?.name] ?? Shield;
                  return <PlanIcon className="h-5 w-5 text-[#ff6d29]" />;
                })()}
              </div>
              <div>
                <p className="text-xs text-gray-400">Active Plan</p>
                <p className="font-bold text-[#26272F] capitalize">
                  {subscription.plan?.name ?? 'Free Trial'}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize self-start sm:self-auto ${
              subscription.status === 'active' ? 'bg-green-100 text-green-700' :
              subscription.status === 'trial'  ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-500'
            }`}>
              {subscription.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400">Expires</p>
              <p className="font-medium text-[#26272F] text-sm">
                {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Trial Ends</p>
              <p className="font-medium text-[#26272F] text-sm">
                {subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : '—'}
              </p>
            </div>
            {subscription.plan?.maxUsers && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Users</span>
                  <span className="font-medium">{business.usersCount ?? 0}/{subscription.plan.maxUsers}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff6d29] rounded-full"
                    style={{ width: `${Math.min(((business.usersCount ?? 0) / subscription.plan.maxUsers) * 100, 100)}%` }} />
                </div>
              </div>
            )}
            {subscription.plan?.maxProducts && subscription.plan.maxProducts !== -1 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Products</span>
                  <span className="font-medium">{business.productsCount ?? 0}/{subscription.plan.maxProducts}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(((business.productsCount ?? 0) / subscription.plan.maxProducts) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Expired warning ───────────────────────────────────────────────── */}
      {subscription?.status === 'expired' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Subscription Expired</p>
            <p className="text-red-600 mt-0.5">Renew your plan below to regain access to all features.</p>
          </div>
        </div>
      )}

      {/* ── Plan selector ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Available Plans</h3>
          <p className="text-xs text-gray-400 mt-0.5">Choose a plan that fits your business</p>
        </div>
        <BillingToggle value={billing} onChange={setBilling} />
      </div>

      {billing === 'yearly' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-4 text-sm text-green-700">
          <TrendingUp className="h-4 w-4 flex-shrink-0" />
          <span>Yearly billing saves you <strong>{yearlySavePct}%</strong> — billed once per year.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.name] ?? Shield;
          const isHighlight = plan.highlight;
          const isEnterprise = plan.isEnterprise;
          const isCurrentPlan = plan.name.toLowerCase() === activePlanName;
          const price = billing === 'monthly' ? plan.monthlyPrice : monthlyEquivalent(plan);
          const discount = yearlyDiscount(plan);

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
              {/* current plan badge */}
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
                  <div className={`p-2 rounded-lg ${
                    isEnterprise ? 'bg-orange-50' : isHighlight ? 'bg-purple-100' : 'bg-blue-50'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isEnterprise ? 'text-[#ff6d29]' : isHighlight ? 'text-purple-500' : 'text-blue-500'
                    }`} />
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

                {/* price */}
                {isEnterprise ? (
                  <div className="mb-4">
                    <p className="text-2xl font-black text-[#26272F]">Custom</p>
                    <p className="text-xs text-gray-400">Contact us for pricing</p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black text-[#26272F]">৳{price.toLocaleString()}</span>
                      <span className="text-sm text-gray-400 mb-1">/mo</span>
                    </div>
                    {billing === 'yearly' && discount > 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        ৳{plan.yearlyPrice.toLocaleString()} billed yearly · Save {discount}%
                      </p>
                    )}
                    {billing === 'monthly' && discount > 0 && (
                      <p className="text-xs text-gray-400">Save {discount}% with yearly billing</p>
                    )}
                  </div>
                )}

                {/* trial */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                  <Clock className="h-3.5 w-3.5 text-green-500" />
                  <span>{plan.trialDays}-day free trial included</span>
                </div>

                {/* features */}
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Enterprise contact */}
                {isEnterprise && <EnterpriseContact />}
              </div>

              {/* CTA */}
              {!isEnterprise && (
                <div className="px-5 pb-5">
                  {isCurrentPlan ? (
                    <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-sm font-semibold text-[#ff6d29]">
                      <CheckCircle2 className="h-4 w-4" /> Current Plan
                    </div>
                  ) : (
                    <button className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-colors min-h-[44px] ${
                      isHighlight ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#26272F] hover:bg-gray-800'
                    }`}>
                      {activePlanName ? 'Switch to ' + plan.name : 'Start Free Trial'}
                    </button>
                  )}
                  <p className="text-center text-xs text-gray-400 mt-2">Contact support to change your plan</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        All prices are exclusive of VAT · Questions?{' '}
        <a href="mailto:support@bizcore.com.bd" className="text-[#ff6d29] hover:underline">support@bizcore.com.bd</a>
      </p>
    </div>
  );
};

export default Subscription;
