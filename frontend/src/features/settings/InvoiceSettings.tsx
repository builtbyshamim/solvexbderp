import { useEffect } from 'react';
import { Save, FileText } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { useForm } from 'react-hook-form';

const STORAGE_KEY = 'bizcore_invoice_settings';

const defaultValues = {
  invoicePrefix: 'INV-',
  purchasePrefix: 'PUR-',
  quotationPrefix: 'QUO-',
  invoiceFooter: 'Thank you for your business!',
  terms: 'Payment due within 30 days.',
  showLogo: true,
  showSignature: false,
  showBankDetails: false,
  taxLabel: 'VAT',
  taxRate: 0,
  bankName: '',
  bankAccount: '',
  bankBranch: '',
};

const inp = 'w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]';

const InvoiceSettings = () => {
  const { t } = useLanguage();
  const { register, handleSubmit, reset } = useForm({ defaultValues });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { reset(JSON.parse(saved)); } catch {}
    }
  }, [reset]);

  const onSubmit = (data: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    toast.success('Invoice settings saved');
  };

  return (
    <div>
      <PageHeader
        title={t('settings.invoiceSettings.title')}
        subtitle={t('settings.invoiceSettings.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.settings') },
          { label: t('settings.invoiceSettings.title') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Prefixes */}
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#ff6d29]" /> Document Prefixes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                  <input {...register('invoicePrefix')} className={inp} placeholder="INV-" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Prefix</label>
                  <input {...register('purchasePrefix')} className={inp} placeholder="PUR-" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Prefix</label>
                  <input {...register('quotationPrefix')} className={inp} placeholder="QUO-" />
                </div>
              </div>
            </div>

            {/* Tax */}
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Tax Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Label</label>
                  <input {...register('taxLabel')} className={inp} placeholder="VAT / GST / Tax" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
                  <input type="number" {...register('taxRate')} min="0" max="100" step="0.1" className={inp} placeholder="0" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Invoice Content</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Footer Message</label>
                <textarea {...register('invoiceFooter')} rows={2}
                  className={`${inp} resize-none`} placeholder="Thank you for your business!" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <textarea {...register('terms')} rows={2}
                  className={`${inp} resize-none`} placeholder="Payment due within 30 days." />
              </div>
            </div>

            {/* Bank details */}
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Bank Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input {...register('bankName')} className={inp} placeholder="Bank name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account No</label>
                  <input {...register('bankAccount')} className={inp} placeholder="Account number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <input {...register('bankBranch')} className={inp} placeholder="Branch name" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Display Options</h3>
              {[
                { name: 'showLogo', label: 'Show Business Logo' },
                { name: 'showSignature', label: 'Show Signature Line' },
                { name: 'showBankDetails', label: 'Show Bank Details' },
              ].map((opt) => (
                <div key={opt.name} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700">{opt.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" {...register(opt.name as any)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-checked:bg-[#ff6d29] rounded-full transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                  </label>
                </div>
              ))}
            </div>

            <button type="submit"
              className="w-full py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] flex items-center justify-center gap-2">
              <Save className="h-4 w-4" /> Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InvoiceSettings;
