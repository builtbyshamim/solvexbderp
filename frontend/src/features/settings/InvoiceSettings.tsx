import { useState } from 'react';
import { Save, FileText, Printer } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';

const InvoiceSettings = () => {
  const [form, setForm] = useState({
    invoice_prefix: 'INV',
    purchase_prefix: 'PUR',
    quotation_prefix: 'QUO',
    invoice_footer: 'Thank you for your business! Please visit again.',
    terms: 'Payment is due within 30 days.',
    show_logo: true,
    show_signature: false,
    show_bank_details: false,
    tax_label: 'VAT',
    tax_rate: '0',
    bank_name: '',
    bank_account: '',
    bank_branch: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Invoice settings saved successfully');
  };

  return (
    <div>
      <PageHeader
        title="Invoice Settings"
        subtitle="Customize invoice layout, numbering, and print options"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Settings' }, { label: 'Invoice Settings' }]}
      />

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
            <FileText className="h-4 w-4 text-[#ff6d29]" />
            <h3 className="text-sm font-semibold text-[#26272F]">Invoice Numbering</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Sales Invoice Prefix', name: 'invoice_prefix', placeholder: 'INV' },
              { label: 'Purchase Invoice Prefix', name: 'purchase_prefix', placeholder: 'PUR' },
              { label: 'Quotation Prefix', name: 'quotation_prefix', placeholder: 'QUO' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <input name={f.name} value={(form as Record<string, unknown>)[f.name] as string} onChange={handleChange} placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
            <Printer className="h-4 w-4 text-[#ff6d29]" />
            <h3 className="text-sm font-semibold text-[#26272F]">Print Options</h3>
          </div>
          <div className="p-5 space-y-3">
            {[
              { name: 'show_logo', label: 'Show company logo on invoice' },
              { name: 'show_signature', label: 'Show signature field' },
              { name: 'show_bank_details', label: 'Show bank account details' },
            ].map((opt) => (
              <label key={opt.name} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name={opt.name}
                  checked={(form as Record<string, unknown>)[opt.name] as boolean}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-[#ff6d29] focus:ring-[#ff6d29]/20"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {form.show_bank_details && (
          <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
              <h3 className="text-sm font-semibold text-[#26272F]">Bank Details</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Bank Name', name: 'bank_name', placeholder: 'e.g. Dutch-Bangla Bank' },
                { label: 'Account Number', name: 'bank_account', placeholder: '1234567890' },
                { label: 'Branch Name', name: 'bank_branch', placeholder: 'Mirpur Branch' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input name={f.name} value={(form as Record<string, unknown>)[f.name] as string} onChange={handleChange} placeholder={f.placeholder}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
            <h3 className="text-sm font-semibold text-[#26272F]">Tax Settings</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tax Label</label>
              <input name="tax_label" value={form.tax_label} onChange={handleChange} placeholder="VAT / GST / Tax"
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default Tax Rate (%)</label>
              <input name="tax_rate" value={form.tax_rate} onChange={handleChange} type="number" min="0" max="100" step="0.5"
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
            <h3 className="text-sm font-semibold text-[#26272F]">Invoice Text</h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Terms & Conditions</label>
              <textarea name="terms" value={form.terms} onChange={handleChange} rows={2}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Footer Message</label>
              <textarea name="invoice_footer" value={form.invoice_footer} onChange={handleChange} rows={2}
                className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Save className="h-4 w-4" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceSettings;
