import { useEffect } from 'react';
import { Save, Building2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { useForm } from 'react-hook-form';
import { useGetBusinessProfileQuery, useUpdateBusinessProfileMutation } from './settingsApi';

const inp = 'w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]';

const BusinessProfile = () => {
  const { t } = useLanguage();
  const { data, isLoading } = useGetBusinessProfileQuery(undefined);
  const [updateProfile, { isLoading: isSaving }] = useUpdateBusinessProfileMutation();
  const { register, handleSubmit, reset } = useForm();

  const business = data;

  useEffect(() => {
    if (business) {
      reset({
        name: business.name ?? '',
        businessType: business.businessType ?? '',
        mobile: business.mobile ?? '',
        email: business.email ?? '',
        address: business.address ?? '',
        city: business.city ?? '',
        country: business.country ?? 'Bangladesh',
        website: business.website ?? '',
        currency: business.currency ?? 'BDT',
        taxId: business.taxId ?? '',
      });
    }
  }, [business, reset]);

  const onSubmit = async (data: any) => {
    try {
      await updateProfile(data).unwrap();
      toast.success('Business profile updated');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('settings.business.title')}
        subtitle={t('settings.business.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.settings') },
          { label: t('settings.business.title') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Basic Info */}
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#ff6d29]" /> Business Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input {...register('name')} className={inp} placeholder="Your Business Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                  <select {...register('businessType')} className={inp}>
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="service">Service</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <input {...register('mobile')} className={inp} placeholder="+880..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input {...register('email')} type="email" className={inp} placeholder="business@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input {...register('website')} className={inp} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                  <input {...register('taxId')} className={inp} placeholder="Tax registration number" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Address</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <textarea {...register('address')} rows={2} className={`${inp} resize-none`} placeholder="Full address..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input {...register('city')} className={inp} placeholder="Dhaka" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input {...register('country')} className={inp} placeholder="Bangladesh" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Regional</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select {...register('currency')} className={inp}>
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={isSaving}
              className="w-full py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center justify-center gap-2">
              {isSaving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BusinessProfile;
