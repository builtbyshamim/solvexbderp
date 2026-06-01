import { useState } from 'react';
import { Save, Building2, Phone, MapPin, Globe } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const BusinessProfile = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    business_name: 'BizCore Demo Shop',
    business_type: 'retail',
    mobile: '01711-000000',
    email: 'demo@bizcore.com',
    address: '123 Mirpur Road, Dhaka-1216',
    city: 'Dhaka',
    country: 'Bangladesh',
    website: '',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
    fiscal_year_start: '01',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Business profile updated successfully');
  };

  return (
    <div>
      <PageHeader
        title={t('settings.business.title')}
        subtitle={t('settings.business.subtitle')}
        breadcrumbs={[{ label: t('common.home'), path: '/admin' }, { label: t('nav.settings') }, { label: t('settings.business.title') }]}
      />

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
            <Building2 className="h-4 w-4 text-[#ff6d29]" />
            <h3 className="text-sm font-semibold text-[#26272F]">{t('settings.business.businessInfo')}</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.business.businessName')}</label>
              <input name="business_name" value={form.business_name} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.business.businessType')}</label>
              <select name="business_type" value={form.business_type} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                <option value="retail">{t('settings.business.retail')}</option>
                <option value="wholesale">{t('settings.business.wholesale')}</option>
                <option value="distributor">{t('settings.business.distributor')}</option>
                <option value="service">{t('settings.business.service')}</option>
                <option value="manufacturer">{t('settings.business.manufacturer')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.business.currency')}</label>
              <select name="currency" value={form.currency} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
            <Phone className="h-4 w-4 text-[#ff6d29]" />
            <h3 className="text-sm font-semibold text-[#26272F]">{t('settings.business.contactDetails')}</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.business.mobile')}</label>
              <input name="mobile" value={form.mobile} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('sales.customers.email')}</label>
              <input name="email" value={form.email} onChange={handleChange} type="email"
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.business.website')}</label>
              <input name="website" value={form.website} onChange={handleChange} placeholder="https://"
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
            <MapPin className="h-4 w-4 text-[#ff6d29]" />
            <h3 className="text-sm font-semibold text-[#26272F]">{t('settings.business.address')}</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.business.streetAddress')}</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.business.city')}</label>
              <input name="city" value={form.city} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.business.country')}</label>
              <input name="country" value={form.country} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
            <Globe className="h-4 w-4 text-[#ff6d29]" />
            <h3 className="text-sm font-semibold text-[#26272F]">{t('settings.business.regional')}</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.business.timezone')}</label>
              <select name="timezone" value={form.timezone} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.business.fiscalYearStart')}</label>
              <select name="fiscal_year_start" value={form.fiscal_year_start} onChange={handleChange}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                  <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Save className="h-4 w-4" /> {t('settings.business.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessProfile;
