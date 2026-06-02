import { CheckCircle2, Crown, Zap, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useFetchMeQuery } from '../../redux/api/authApi';

const PLANS = [
  {
    name: 'Starter',
    price: '৳500/month',
    features: ['3 Users', '500 Products', '1 Warehouse', 'Basic Reports', '15-day Free Trial'],
    icon: <Zap className="h-5 w-5 text-blue-500" />,
    bg: 'bg-blue-50 border-blue-200',
    badgeCls: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Pro',
    price: '৳1,200/month',
    features: ['25 Users', 'Unlimited Products', '5 Warehouses', 'Full Reports', 'Priority Support'],
    icon: <Crown className="h-5 w-5 text-purple-500" />,
    bg: 'bg-purple-50 border-purple-200',
    badgeCls: 'bg-purple-100 text-purple-700',
  },
];

const Subscription = () => {
  const { t } = useLanguage();
  const { data: meData } = useFetchMeQuery();
  const business = meData?.data?.business;
  const subscription = business?.subscription;

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

      {/* Current plan */}
      {subscription && (
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">Current Plan</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">Plan</p>
              <p className="font-semibold text-[#26272F] capitalize">{subscription.plan?.name ?? 'Free Trial'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                subscription.status === 'active' ? 'bg-green-100 text-green-700' :
                subscription.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-500'
              }`}>{subscription.status}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400">Expires</p>
              <p className="font-medium text-[#26272F]">
                {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Trial Ends</p>
              <p className="font-medium text-[#26272F]">
                {subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          {/* Usage */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subscription.plan?.maxUsers && (
              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-gray-500">Users</span>
                  <span className="font-medium">{business.usersCount ?? 0} / {subscription.plan.maxUsers}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff6d29] rounded-full"
                    style={{ width: `${Math.min(((business.usersCount ?? 0) / subscription.plan.maxUsers) * 100, 100)}%` }} />
                </div>
              </div>
            )}
            {subscription.plan?.maxProducts && subscription.plan.maxProducts !== -1 && (
              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-gray-500">Products</span>
                  <span className="font-medium">{business.productsCount ?? 0} / {subscription.plan.maxProducts}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(((business.productsCount ?? 0) / subscription.plan.maxProducts) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expired warning */}
      {subscription?.status === 'expired' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Subscription Expired</p>
            <p className="text-red-600 mt-0.5">Please contact support to renew your subscription.</p>
          </div>
        </div>
      )}

      {/* Available plans */}
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Available Plans</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {PLANS.map((plan) => (
          <div key={plan.name} className={`border rounded-xl p-5 ${plan.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              {plan.icon}
              <h4 className="text-base font-bold text-[#26272F]">{plan.name}</h4>
              <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium ${plan.badgeCls}`}>{plan.price}</span>
            </div>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-400">Contact support to upgrade or change your plan.</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;
