import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CheckCircle2, Zap, Crown, Building2, ArrowRight,
  Phone, Users, Package as PackageIcon, Warehouse, Star, CreditCard,
} from 'lucide-react';
import { useGetPublicPackagesQuery, useSubscribeToPackageMutation } from '../../redux/api/packagesApi';
import type { Package } from '../../redux/api/packagesApi';
import PaymentRequestModal from '../billing/PaymentRequestModal';

const PLAN_ICONS: Record<string, React.ElementType> = {
  Starter: Zap, Pro: Crown, Enterprise: Building2,
};

const WHATSAPP = '8801XXXXXXXXX';

function PriceDisplay({ pkg, cycle }: { pkg: Package; cycle: 'monthly' | 'yearly' }) {
  const price = cycle === 'yearly' ? pkg.yearlyPrice : pkg.monthlyPrice;
  const monthlyEquiv = cycle === 'yearly' ? Math.round(pkg.yearlyPrice / 12) : pkg.monthlyPrice;
  const discount = pkg.monthlyPrice > 0
    ? Math.round((1 - pkg.yearlyPrice / (pkg.monthlyPrice * 12)) * 100)
    : 0;

  if (pkg.isEnterprise) {
    return (
      <div className="text-center py-2">
        <p className="text-3xl font-black text-[#26272F]">Custom</p>
        <p className="text-sm text-gray-400 mt-0.5">Contact us for pricing</p>
      </div>
    );
  }

  return (
    <div className="text-center py-2">
      {cycle === 'yearly' ? (
        <>
          <div className="flex items-end justify-center gap-1">
            <p className="text-3xl font-black text-[#26272F]">৳{monthlyEquiv.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mb-1">/mo</p>
          </div>
          <p className="text-xs text-gray-500">৳{price.toLocaleString()} billed yearly</p>
          {discount > 0 && (
            <p className="text-xs text-green-600 font-semibold mt-0.5">Save {discount}% vs monthly</p>
          )}
        </>
      ) : (
        <>
          <div className="flex items-end justify-center gap-1">
            <p className="text-3xl font-black text-[#26272F]">৳{price.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mb-1">/mo</p>
          </div>
          {discount > 0 && (
            <p className="text-xs text-green-600 font-semibold mt-0.5">Save {discount}% with yearly</p>
          )}
        </>
      )}
    </div>
  );
}

function LimitBadge({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
      <span>{value === -1 ? `Unlimited ${label}` : `Up to ${value} ${label}`}</span>
    </div>
  );
}

function PlanCard({
  pkg,
  cycle,
  selected,
  onSelect,
  isLoading,
  onPayDirectly,
}: {
  pkg: Package;
  cycle: 'monthly' | 'yearly';
  selected: boolean;
  onSelect: (id: string) => void;
  isLoading: boolean;
  onPayDirectly?: (pkg: Package) => void;
}) {
  const Icon = PLAN_ICONS[pkg.name] ?? Zap;
  const isEnterprise = pkg.isEnterprise;

  if (isEnterprise) {
    return (
      <div className="bg-white border-2 border-[#26272F] rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gray-900">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-[#26272F] text-lg">{pkg.name}</p>
            {pkg.badge && <p className="text-[11px] text-gray-500 font-medium">{pkg.badge}</p>}
          </div>
        </div>

        <PriceDisplay pkg={pkg} cycle={cycle} />

        <ul className="space-y-2">
          {(pkg.features ?? []).slice(0, 6).map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        <a
          href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi! I'm interested in SolvexBD Enterprise plan.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold transition-colors"
        >
          <Phone className="h-4 w-4" />
          Contact Us
        </a>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-white border-2 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 ${
        selected
          ? 'border-[#ff6d29] shadow-lg shadow-orange-100 scale-[1.01]'
          : pkg.highlight
          ? 'border-[#ff6d29]/40 hover:border-[#ff6d29] shadow-sm hover:shadow-md'
          : 'border-[#DBDFE9] hover:border-gray-300 shadow-sm hover:shadow-md'
      }`}
    >
      {pkg.highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1.5 bg-[#ff6d29] text-white text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
            <Star className="h-3 w-3 fill-white" />
            {pkg.badge ?? 'Most Popular'}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mt-1">
        <div className={`p-2.5 rounded-xl ${pkg.highlight ? 'bg-orange-50' : 'bg-blue-50'}`}>
          <Icon className={`h-5 w-5 ${pkg.highlight ? 'text-[#ff6d29]' : 'text-blue-500'}`} />
        </div>
        <div>
          <p className="font-bold text-[#26272F] text-lg">{pkg.name}</p>
          {!pkg.highlight && pkg.badge && (
            <p className="text-[11px] text-gray-500 font-medium">{pkg.badge}</p>
          )}
        </div>
      </div>

      <PriceDisplay pkg={pkg} cycle={cycle} />

      <div className="space-y-1.5 py-1 border-t border-gray-100">
        <LimitBadge label="users" value={pkg.maxUsers} icon={Users} />
        <LimitBadge label="products" value={pkg.maxProducts} icon={PackageIcon} />
        <LimitBadge label="warehouses" value={pkg.maxWarehouses} icon={Warehouse} />
      </div>

      <ul className="space-y-2 flex-1">
        {(pkg.features ?? []).slice(0, 6).map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${pkg.highlight ? 'text-[#ff6d29]' : 'text-green-500'}`} />
            {f}
          </li>
        ))}
      </ul>

      {pkg.trialDays > 0 && (
        <p className="text-xs text-center text-blue-600 font-medium bg-blue-50 rounded-lg py-1.5">
          {pkg.trialDays}-day free trial included
        </p>
      )}

      <button
        onClick={() => onSelect(pkg.id)}
        disabled={isLoading}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          selected || pkg.highlight
            ? 'bg-[#ff6d29] hover:bg-[#e65a1f] text-white'
            : 'bg-[#26272F] hover:bg-gray-700 text-white'
        }`}
      >
        {isLoading && selected ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Activating...
          </>
        ) : (
          <>
            {pkg.trialDays > 0 ? 'Start Free Trial' : 'Get Started'}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {pkg.trialDays > 0 && onPayDirectly && (
        <button
          type="button"
          onClick={() => onPayDirectly(pkg)}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-[#ff6d29] hover:bg-orange-50 transition-colors border border-dashed border-gray-200 hover:border-[#ff6d29]/40"
        >
          <CreditCard className="h-3.5 w-3.5" />
          Skip trial — Pay directly (bKash / Rocket / Nagad)
        </button>
      )}
    </div>
  );
}

export default function SelectPlan() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [payPkg, setPayPkg]             = useState<Package | null>(null);

  const { data: packages, isLoading: loadingPackages } = useGetPublicPackagesQuery();
  const [subscribe, { isLoading: isSubscribing }]      = useSubscribeToPackageMutation();

  const plans = (packages ?? []).filter((p) => p.isActive);
  const nonEnterprise = plans.filter((p) => !p.isEnterprise);
  const representative = nonEnterprise[0];
  const yearlySavePct = representative && representative.monthlyPrice > 0
    ? Math.round((1 - representative.yearlyPrice / (representative.monthlyPrice * 12)) * 100)
    : 0;

  const handleSelect = async (packageId: string) => {
    const pkg = plans.find((p) => p.id === packageId);
    if (!pkg) return;
    if (pkg.isEnterprise) return;

    setSelectedId(packageId);
    try {
      const result = await subscribe({ packageId, billingCycle }).unwrap();
      toast.success(result.message);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to activate plan. Please try again.');
      setSelectedId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff6d29] flex items-center justify-center">
              <span className="text-white font-black text-sm">SX</span>
            </div>
            <span className="text-white font-bold text-lg">SolvexBD ERP</span>
          </div>
          <span className="text-gray-500 text-sm hidden sm:block">
            Step 2 of 2 — Choose your plan
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#ff6d29]/10 border border-[#ff6d29]/20 text-[#ff6d29] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <CheckCircle2 className="h-4 w-4" />
            Account created successfully!
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            Choose your plan
          </h1>
          <p className="text-gray-400 text-base max-w-lg mx-auto">
            Start with a free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl gap-1">
            {(['monthly', 'yearly'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  billingCycle === cycle
                    ? 'bg-[#ff6d29] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                {cycle === 'yearly' && yearlySavePct > 0 && (
                  <span className="absolute -top-2.5 -right-3 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                    -{yearlySavePct}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan grid */}
        {loadingPackages ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#ff6d29]/30 border-t-[#ff6d29] rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading plans...</p>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm mb-4">No plans available at the moment.</p>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi! I just registered on SolvexBD ERP and need to choose a plan.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Phone className="h-4 w-4" />
              Contact us on WhatsApp
            </a>
          </div>
        ) : (
          <div className={`grid gap-5 ${
            plans.length === 1 ? 'max-w-sm mx-auto' :
            plans.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {plans.map((pkg) => (
              <PlanCard
                key={pkg.id}
                pkg={pkg}
                cycle={billingCycle}
                selected={selectedId === pkg.id}
                onSelect={handleSelect}
                isLoading={isSubscribing}
                onPayDirectly={setPayPkg}
              />
            ))}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-gray-600 text-xs mt-10">
          All plans include SSL security, daily backups, and dedicated support.
          <br />
          Have questions? &nbsp;
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#ff6d29] hover:underline"
          >
            Chat with us on WhatsApp
          </a>
        </p>
      </div>

      {/* Payment modal */}
      {payPkg && (
        <PaymentRequestModal
          isOpen={!!payPkg}
          onClose={() => setPayPkg(null)}
          pkg={payPkg}
          billingCycle={billingCycle}
          onSuccess={() => navigate('/admin', { replace: true })}
        />
      )}
    </div>
  );
}
