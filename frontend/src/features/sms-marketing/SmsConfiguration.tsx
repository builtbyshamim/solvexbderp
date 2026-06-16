import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Send, CheckCircle, XCircle, Shield, Zap, Globe, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { smsMarketingApi } from './smsMarketingApi';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const { useGetSmsConfigQuery, useSaveSmsConfigMutation, useTestSmsMutation } = smsMarketingApi;

const PROVIDERS = [
  {
    value: 'ssl_wireless',
    label: 'SSL Wireless',
    desc: 'Popular Bangladesh SMS gateway',
    flag: '🇧🇩',
    color: 'border-green-300 bg-green-50',
    activeColor: 'border-green-500 bg-green-50 ring-2 ring-green-400/30',
  },
  {
    value: 'alpha_net',
    label: 'Alpha Net',
    desc: 'Reliable BD bulk SMS provider',
    flag: '🇧🇩',
    color: 'border-blue-200 bg-blue-50',
    activeColor: 'border-blue-500 bg-blue-50 ring-2 ring-blue-400/30',
  },
  {
    value: 'twilio',
    label: 'Twilio',
    desc: 'Global SMS & communication platform',
    flag: '🌐',
    color: 'border-red-200 bg-red-50',
    activeColor: 'border-red-500 bg-red-50 ring-2 ring-red-400/30',
  },
  {
    value: 'nexmo',
    label: 'Vonage (Nexmo)',
    desc: 'Enterprise-grade global messaging',
    flag: '🌐',
    color: 'border-purple-200 bg-purple-50',
    activeColor: 'border-purple-500 bg-purple-50 ring-2 ring-purple-400/30',
  },
  {
    value: 'custom',
    label: 'Custom API',
    desc: 'Connect your own SMS gateway',
    flag: '⚙️',
    color: 'border-gray-200 bg-gray-50',
    activeColor: 'border-gray-500 bg-gray-50 ring-2 ring-gray-400/30',
  },
];

const SmsConfiguration = () => {
  const { t } = useLanguage();
  const { data: config, isLoading } = useGetSmsConfigQuery(undefined);
  const [saveConfig, { isLoading: isSaving }] = useSaveSmsConfigMutation();
  const [testSms, { isLoading: isTesting }] = useTestSmsMutation();

  const [form, setForm] = useState({
    provider: 'ssl_wireless',
    apiKey: '',
    apiSecret: '',
    senderId: '',
    apiUrl: '',
    testMode: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (config) {
      setForm({
        provider: config.provider || 'ssl_wireless',
        apiKey: '',
        apiSecret: '',
        senderId: config.senderId || '',
        apiUrl: config.apiUrl || '',
        testMode: config.testMode ?? false,
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await saveConfig(form).unwrap();
      toast.success('Configuration saved successfully');
    } catch { toast.error('Failed to save configuration'); }
  };

  const handleTest = async () => {
    if (!testPhone.trim()) return toast.error('Enter a phone number for testing');
    try {
      const res = await testSms({ phone: testPhone, message: 'Test SMS from BizCore ERP. Configuration is working correctly.' }).unwrap();
      setTestResult(res);
      if (res.success) toast.success('Test SMS sent!');
      else toast.error('Test failed — check your configuration');
    } catch { toast.error('Test failed'); }
  };

  const selectedProvider = PROVIDERS.find((p) => p.value === form.provider);

  return (
    <div>
      <PageHeader
        title={t('sms.config.title')}
        subtitle={t('sms.config.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('sms.overview.title'), path: '/admin/sms-marketing' },
          { label: t('sms.config.title') },
        ]}
        actions={
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50 transition-colors">
            <Settings className="h-4 w-4" />
            {isSaving ? t('sms.config.saving') : t('sms.config.saveConfiguration')}
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-[#ff6d29] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
          <div className="lg:col-span-2 space-y-6">
            {/* Provider Selection */}
            <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
              <div className="p-5 border-b border-[#DBDFE9] flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#ff6d29]" />
                <h2 className="font-semibold text-[#26272F]">{t('sms.config.smsProvider')}</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {PROVIDERS.map((p) => (
                    <button key={p.value} onClick={() => setForm({ ...form, provider: p.value })}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${form.provider === p.value ? p.activeColor : p.color + ' hover:border-gray-300'}`}>
                      <div className="text-2xl mb-2">{p.flag}</div>
                      <p className="font-semibold text-sm text-[#26272F]">{p.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                      {form.provider === p.value && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle className="h-3.5 w-3.5" /> {t('sms.config.selected')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* API Credentials */}
            <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
              <div className="p-5 border-b border-[#DBDFE9] flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#ff6d29]" />
                <h2 className="font-semibold text-[#26272F]">{t('sms.config.apiCredentials')}</h2>
                <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> {t('sms.config.encrypted')}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* API Key */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t('sms.config.apiKey')} {form.provider !== 'custom' && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={config?.apiKey ? '••••••••••••' : 'Enter API key'}
                        value={form.apiKey}
                        onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                        className="w-full pr-10 pl-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] font-mono"
                      />
                      <button onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {config?.apiKey && !form.apiKey && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> {t('sms.config.keyConfigured')}
                      </p>
                    )}
                  </div>

                  {/* API Secret (Twilio / Nexmo) */}
                  {['twilio', 'nexmo'].includes(form.provider) && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.config.apiSecret')} <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type={showApiSecret ? 'text' : 'password'}
                          placeholder="Enter API secret"
                          value={form.apiSecret}
                          onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
                          className="w-full pr-10 pl-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] font-mono"
                        />
                        <button onClick={() => setShowApiSecret(!showApiSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sender ID */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.config.senderId')} <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. BizCore or 01700000000"
                      value={form.senderId}
                      onChange={(e) => setForm({ ...form, senderId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                    <p className="text-xs text-gray-400 mt-1">{t('sms.config.senderIdHint')}</p>
                  </div>

                  {/* Custom API URL */}
                  {form.provider === 'custom' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.config.apiUrl')} <span className="text-red-500">*</span></label>
                      <input type="url" placeholder="https://your-sms-gateway.com/api/send"
                        value={form.apiUrl}
                        onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
                        className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                    </div>
                  )}
                </div>

                {/* Test Mode */}
                <div className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${form.testMode ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                  onClick={() => setForm({ ...form, testMode: !form.testMode })}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-5 w-5 ${form.testMode ? 'text-yellow-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-[#26272F]">{t('sms.config.testMode')}</p>
                      <p className="text-xs text-gray-500">{t('sms.config.testModeHint')}</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${form.testMode ? 'bg-yellow-400' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${form.testMode ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Test SMS */}
            <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
              <div className="p-5 border-b border-[#DBDFE9] flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#ff6d29]" />
                <h2 className="font-semibold text-[#26272F]">{t('sms.config.testConnection')}</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-4">{t('sms.config.testConnectionDesc')}</p>
                <div className="flex gap-3">
                  <input type="text" placeholder="Test phone number (e.g. 01700000000)" value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                  <button onClick={handleTest} disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0">
                    <Send className="h-4 w-4" />
                    {isTesting ? t('sms.config.testing') : t('sms.config.sendTest')}
                  </button>
                </div>
                {testResult && (
                  <div className={`mt-3 flex items-start gap-2 p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {testResult.success
                      ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Status & Info */}
          <div className="space-y-4">
            {/* Current Status */}
            <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
              <div className="p-4 border-b border-[#DBDFE9]">
                <h2 className="font-semibold text-[#26272F] text-sm">{t('sms.config.currentStatus')}</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('sms.config.provider')}</span>
                  <span className="font-medium text-[#26272F]">{selectedProvider?.label ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('sms.config.senderId')}</span>
                  <span className="font-medium text-[#26272F]">{config?.senderId || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('sms.config.mode')}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config?.testMode ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {config?.testMode ? t('sms.config.testModeLabel') : t('sms.config.live')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t('sms.config.apiKey')}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config?.apiKey ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {config?.apiKey ? t('sms.config.configured') : t('sms.config.notSet')}
                  </span>
                </div>
              </div>
            </div>

            {/* Provider Info */}
            <div className="bg-gradient-to-br from-[#ff6d29]/5 to-orange-50 border border-orange-100 rounded-xl p-4 text-sm space-y-2">
              <p className="font-semibold text-[#26272F] flex items-center gap-1.5">
                <span className="text-lg">{selectedProvider?.flag}</span> {selectedProvider?.label}
              </p>
              <p className="text-gray-500 text-xs">{selectedProvider?.desc}</p>
              {form.provider === 'ssl_wireless' && (
                <div className="text-xs text-gray-500 space-y-1 pt-1 border-t border-orange-100">
                  <p>• Get API key from ssl.com.bd portal</p>
                  <p>• Sender ID must be pre-approved</p>
                  <p>• Supports Bangla & English SMS</p>
                </div>
              )}
              {form.provider === 'twilio' && (
                <div className="text-xs text-gray-500 space-y-1 pt-1 border-t border-orange-100">
                  <p>• Account SID is your API Key</p>
                  <p>• Auth Token is your API Secret</p>
                  <p>• Get from console.twilio.com</p>
                </div>
              )}
              {form.provider === 'custom' && (
                <div className="text-xs text-gray-500 space-y-1 pt-1 border-t border-orange-100">
                  <p>• Endpoint must accept POST requests</p>
                  <p>• Expected params: to, message, sender</p>
                  <p>• Should return JSON with status field</p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button onClick={handleSave} disabled={isSaving}
              className="w-full py-2.5 bg-[#ff6d29] text-white rounded-xl text-sm font-semibold hover:bg-[#e65a1f] disabled:opacity-50 transition-colors">
              {isSaving ? t('sms.config.saving') : t('sms.config.saveConfiguration')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsConfiguration;
