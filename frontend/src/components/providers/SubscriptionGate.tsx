import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Lock, CreditCard, LogOut, Clock, AlertTriangle,
  CheckCircle2, Crown, Zap, Building2, ArrowRight, Phone,
} from 'lucide-react';
import { useFetchMeQuery } from '../../redux/api/authApi';
import { useLogoutMutation } from '../../redux/api/authApi';
import Cookies from 'js-cookie';
import { accessTokenKey, refreshTokenKey } from '../../contents/token';
import { useGetPublicPackagesQuery } from '../../redux/api/packagesApi';
import { yearlyDiscount } from '../../data/mockPackages';

const PLAN_ICONS: Record<string, React.ElementType> = {
  Starter: Zap, Pro: Crown, Enterprise: Building2,
};

const WHATSAPP = '8801XXXXXXXXX';

function SubscriptionLockedPage({ status, daysLeft, expiresAt }: {
  status: string;
  daysLeft: number | null;
  expiresAt: string | null;
}) {
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const { data: packagesData } = useGetPublicPackagesQuery();
  const plans = (packagesData?.data ?? []).filter((p) => p.isActive && !p.isEnterprise);

  const handleLogout = async () => {
    try { await logout(undefined).unwrap(); } catch { /* ignore */ }
    Cookies.remove(accessTokenKey);
    Cookies.remove(refreshTokenKey);
    navigate('/login');
  };

  const isTrial = status === 'trial';
  const isExpired = status === 'expired';
  const isSuspended = status === 'suspended';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#ff6d29] flex items-center justify-center">
            <span className="text-white font-black text-xs">B</span>
          </div>
          <span className="font-bold text-[#26272F] text-sm">BizCore ERP</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/settings/subscription"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff6d29] text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors"
          >
            <CreditCard className="h-3.5 w-3.5" /> Subscription
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* Main locked content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-10 max-w-4xl mx-auto w-full">

        {/* Status banner */}
        <div className={`w-full flex items-start gap-4 p-5 rounded-2xl mb-8 border ${
          isSuspended
            ? 'bg-red-50 border-red-200'
            : isExpired
            ? 'bg-amber-50 border-amber-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isSuspended ? 'bg-red-100' : isExpired ? 'bg-amber-100' : 'bg-blue-100'
          }`}>
            {isSuspended
              ? <AlertTriangle className="h-6 w-6 text-red-500" />
              : isExpired
              ? <Clock className="h-6 w-6 text-amber-500" />
              : <Lock className="h-6 w-6 text-blue-500" />}
          </div>
          <div className="flex-1">
            <h2 className={`font-bold text-lg ${
              isSuspended ? 'text-red-700' : isExpired ? 'text-amber-700' : 'text-blue-700'
            }`}>
              {isSuspended
                ? 'Account Suspended'
                : isExpired
                ? 'Subscription Expired'
                : 'Subscription Required'}
            </h2>
            <p className={`text-sm mt-1 ${
              isSuspended ? 'text-red-600' : isExpired ? 'text-amber-600' : 'text-blue-600'
            }`}>
              {isSuspended
                ? 'Your account has been suspended by the administrator. Please contact support to resolve this.'
                : isExpired
                ? `Your subscription expired${expiresAt ? ` on ${new Date(expiresAt).toLocaleDateString()}` : ''}. Renew now to regain access to all features.`
                : 'Your free trial has ended. Choose a plan below to continue using BizCore ERP.'}
            </p>
            {daysLeft !== null && daysLeft > 0 && isTrial && (
              <p className="text-xs text-blue-500 font-semibold mt-1.5">
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining in trial
              </p>
            )}
          </div>
        </div>

        {/* What's locked */}
        <div className="w-full bg-white border border-[#DBDFE9] rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-600">These features are locked:</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              'Inventory & Products', 'Sales & POS', 'Purchase & Suppliers',
              'Accounting & Ledger', 'HRM & Payroll', 'Reports & Analytics',
              'SMS Marketing', 'Warehouse Management',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg opacity-60">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 truncate">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        {!isSuspended && plans.length > 0 && (
          <div className="w-full">
            <h3 className="text-base font-bold text-[#26272F] mb-4">Choose Your Plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {plans.map((plan) => {
                const Icon = PLAN_ICONS[plan.name] ?? Zap;
                const discount = yearlyDiscount(plan);
                return (
                  <div
                    key={plan.id}
                    className={`bg-white border-2 rounded-2xl p-5 flex flex-col gap-3 ${
                      plan.highlight ? 'border-[#ff6d29] shadow-md shadow-orange-100' : 'border-[#DBDFE9]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${plan.highlight ? 'bg-orange-50' : 'bg-blue-50'}`}>
                          <Icon className={`h-5 w-5 ${plan.highlight ? 'text-[#ff6d29]' : 'text-blue-500'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-[#26272F]">{plan.name}</p>
                          {plan.badge && <p className="text-[10px] text-[#ff6d29] font-semibold">{plan.badge}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-[#26272F]">৳{plan.monthlyPrice.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">/month</p>
                      </div>
                    </div>

                    {discount > 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        Save {discount}% with yearly billing (৳{plan.yearlyPrice.toLocaleString()}/yr)
                      </p>
                    )}

                    <ul className="space-y-1.5">
                      {plan.features.slice(0, 5).map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <a
                      href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi! I want to subscribe to BizCore ${plan.name} plan.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        plan.highlight
                          ? 'bg-[#ff6d29] hover:bg-orange-600 text-white'
                          : 'bg-[#26272F] hover:bg-gray-800 text-white'
                      }`}
                    >
                      <Phone className="h-4 w-4" />
                      Subscribe to {plan.name}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact + go to subscription page */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/admin/settings/subscription"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#ff6d29] text-[#ff6d29] text-sm font-semibold hover:bg-orange-50 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            View All Plans <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi! I need help with my BizCore subscription.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold transition-colors"
          >
            <Phone className="h-4 w-4" />
            Contact Support on WhatsApp
          </a>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Your data is safe and will be restored immediately after subscription renewal.
        </p>
      </div>
    </div>
  );
}

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export default function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { data: meData, isLoading } = useFetchMeQuery();
  const { pathname } = useLocation();

  // Always allow the subscription settings page
  const isSubscriptionPage = pathname === '/admin/settings/subscription';

  if (isLoading) return null;

  const subscription = meData?.data?.subscription;

  if (!isSubscriptionPage && subscription && !subscription.isActive) {
    return (
      <SubscriptionLockedPage
        status={subscription.status}
        daysLeft={subscription.daysLeft ?? null}
        expiresAt={subscription.expiresAt ?? null}
      />
    );
  }

  return <>{children}</>;
}
