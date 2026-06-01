import { CheckCircle2, Crown, Zap } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const currentPlan = {
  name: 'Starter',
  status: 'active',
  expires_at: '2025-08-01',
  max_users: 3,
  current_users: 3,
  max_products: 500,
  current_products: 124,
  price: 500,
};

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 500,
    icon: Zap,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    features: ['3 Users', '500 Products', '1 Warehouse', 'Basic Reports', 'POS & Sales', 'Email Support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1200,
    icon: Crown,
    color: 'text-[#ff6d29]',
    bg: 'bg-orange-50',
    border: 'border-[#ff6d29]',
    features: ['25 Users', 'Unlimited Products', '5 Warehouses', 'Full Reports', 'POS & Sales', 'Priority Support', 'HRM Module', 'Accounting Module'],
  },
];

const Subscription = () => {
  const { t } = useLanguage();
  const usedUsersPercent = (currentPlan.current_users / currentPlan.max_users) * 100;
  const usedProductsPercent = (currentPlan.current_products / currentPlan.max_products) * 100;

  return (
    <div>
      <PageHeader
        title={t('settings.subscription.title')}
        subtitle={t('settings.subscription.subtitle')}
        breadcrumbs={[{ label: t('common.home'), path: '/admin' }, { label: t('nav.settings') }, { label: t('settings.subscription.title') }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('settings.subscription.currentPlan')}</p>
          <p className="text-xl font-bold text-[#26272F] mt-1">{currentPlan.name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium capitalize">{currentPlan.status}</span>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('settings.subscription.expiresOn')}</p>
          <p className="text-xl font-bold text-[#26272F] mt-1">{currentPlan.expires_at}</p>
          <p className="text-xs text-gray-400 mt-1">{t('settings.subscription.autoRenewalOff')}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('settings.subscription.monthlyCost')}</p>
          <p className="text-xl font-bold text-[#26272F] mt-1">৳{currentPlan.price.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{t('settings.subscription.perMonthLabel')}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm p-5 mb-6">
        <h3 className="text-sm font-semibold text-[#26272F] mb-4">{t('settings.subscription.usage')}</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
              <span>{t('settings.subscription.users')}</span>
              <span>{currentPlan.current_users} / {currentPlan.max_users}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usedUsersPercent >= 90 ? 'bg-red-500' : 'bg-[#ff6d29]'}`}
                style={{ width: `${usedUsersPercent}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
              <span>{t('settings.subscription.products')}</span>
              <span>{currentPlan.current_products} / {currentPlan.max_products}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usedProductsPercent >= 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${usedProductsPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-[#26272F] mb-3">{t('settings.subscription.availablePlans')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.name === currentPlan.name;
          return (
            <div key={plan.id} className={`bg-white border-2 rounded-xl p-5 ${isCurrent ? plan.border : 'border-[#DBDFE9]'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${plan.bg}`}><Icon className={`h-4 w-4 ${plan.color}`} /></div>
                <span className="font-semibold text-[#26272F]">{plan.name}</span>
                {isCurrent && <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">{t('settings.subscription.currentBadge')}</span>}
              </div>
              <div className="mb-4">
                <span className="text-2xl font-bold text-[#26272F]">৳{plan.price.toLocaleString()}</span>
                <span className="text-xs text-gray-500">{t('settings.subscription.perMonth')}</span>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => isCurrent ? toast('Already on this plan') : toast.success(`Upgrade to ${plan.name} requested`)}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${isCurrent ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-[#ff6d29] text-white hover:bg-[#e65a1f]'}`}
                disabled={isCurrent}
              >
                {isCurrent ? t('settings.subscription.currentPlanBtn') : `${t('settings.subscription.upgradeTo')} ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Subscription;
