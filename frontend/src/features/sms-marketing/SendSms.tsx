import { useState } from 'react';
import { Send, Plus, X, Users, MessageSquare, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useQuickSendSmsMutation, useGetSmsTemplatesQuery } from './smsMarketingApi';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const CHAR_LIMIT = 160;

const SendSms = () => {
  const { t } = useLanguage();
  const [phones, setPhones] = useState<string[]>([]);
  const [phoneInput, setPhoneInput] = useState('');
  const [message, setMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const [quickSend, { isLoading }] = useQuickSendSmsMutation();
  const { data: tplData } = useGetSmsTemplatesQuery({ limit: 50 });
  const templates = tplData?.data ?? [];

  const charCount = message.length;
  const parts = Math.ceil(charCount / CHAR_LIMIT) || 1;

  const addPhone = () => {
    const cleaned = phoneInput.trim();
    if (!cleaned) return;

    const nums = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
    const unique = nums.filter((n) => !phones.includes(n));
    if (!unique.length) { toast.error('Number already added'); setPhoneInput(''); return; }
    setPhones([...phones, ...unique]);
    setPhoneInput('');
  };

  const removePhone = (p: string) => setPhones(phones.filter((n) => n !== p));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addPhone(); }
  };

  const applyTemplate = (tplId: string) => {
    const tpl = templates.find((t: any) => t.id === tplId);
    if (tpl) setMessage(tpl.content);
  };

  const handleSend = async () => {
    if (!phones.length) return toast.error('Add at least one phone number');
    if (!message.trim()) return toast.error('Message cannot be empty');

    try {
      const res = await quickSend({
        phoneNumbers: phones,
        message,
        recipientName: recipientName || undefined,
      }).unwrap();
      setResult({ sent: res.sentCount, failed: res.failedCount, total: res.totalCount });
      toast.success(`SMS sent to ${res.sentCount} recipients`);
      setPhones([]);
      setMessage('');
      setPhoneInput('');
      setRecipientName('');
    } catch {
      toast.error('Failed to send SMS');
    }
  };

  return (
    <div>
      <PageHeader
        title={t('sms.send.title')}
        subtitle={t('sms.send.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('sms.overview.title'), path: '/admin/sms-marketing' },
          { label: t('sms.send.title') },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Phone Numbers */}
          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
            <div className="p-4 border-b border-[#DBDFE9] flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#ff6d29]" />
              <h2 className="font-semibold text-[#26272F]">{t('sms.send.recipients')}</h2>
              {phones.length > 0 && (
                <span className="ml-auto text-xs bg-[#ff6d29]/10 text-[#ff6d29] font-medium px-2 py-0.5 rounded-full">
                  {phones.length} {t('sms.send.added')}
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="01700000000 (Enter or , to add)"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-9 pr-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                  />
                </div>
                <button onClick={addPhone}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors shrink-0">
                  <Plus className="h-4 w-4" /> {t('sms.send.add')}
                </button>
              </div>

              {phones.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                  {phones.map((p) => (
                    <span key={p} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white border border-[#DBDFE9] rounded-full text-sm text-[#26272F] font-medium">
                      {p}
                      <button onClick={() => removePhone(p)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.send.recipientName')} <span className="text-gray-400">(optional)</span></label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="e.g. Customer" value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="pl-9 pr-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
            <div className="p-4 border-b border-[#DBDFE9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#ff6d29]" />
                <h2 className="font-semibold text-[#26272F]">{t('sms.send.message')}</h2>
              </div>
              <span className={`text-xs font-medium ${charCount > CHAR_LIMIT ? 'text-orange-500' : 'text-gray-400'}`}>
                {charCount} / {CHAR_LIMIT} · {parts} part{parts > 1 ? 's' : ''}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {templates.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.send.useTemplate')}</label>
                  <select onChange={(e) => applyTemplate(e.target.value)} defaultValue=""
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] bg-white">
                    <option value="">{t('sms.send.selectTemplate')}</option>
                    {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <textarea
                rows={6}
                placeholder="Type your message here... You can use {name}, {amount}, {date} for personalization."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none"
              />
              {charCount > CHAR_LIMIT && (
                <div className="flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Message exceeds 160 characters — will be sent as {parts} SMS parts, increasing cost.
                </div>
              )}
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isLoading || !phones.length || !message.trim()}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#ff6d29] text-white rounded-xl text-sm font-semibold hover:bg-[#e65a1f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send className="h-4 w-4" />
            {isLoading ? t('sms.send.sending') : `${t('sms.send.title')} (${phones.length || 0})`}
          </button>
        </div>

        {/* Summary Panel */}
        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
            <div className="p-4 border-b border-[#DBDFE9]">
              <h2 className="font-semibold text-[#26272F] text-sm">{t('sms.send.preview')}</h2>
            </div>
            <div className="p-4">
              <div className="bg-gray-50 rounded-xl p-4 relative">
                <div className="absolute top-2 right-2 text-xs text-gray-400">SMS</div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {message || <span className="text-gray-400 italic">{t('sms.send.previewPlaceholder')}</span>}
                </p>
                {charCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
                    <span>{charCount} chars</span>
                    <span>{parts} part{parts > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
            <div className="p-4 border-b border-[#DBDFE9]">
              <h2 className="font-semibold text-[#26272F] text-sm">{t('sms.send.summary')}</h2>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {[
                { labelKey: 'sms.send.recipients' as const, value: phones.length },
                { labelKey: 'sms.send.smsParts' as const, value: parts },
                { labelKey: 'sms.send.totalSms' as const, value: phones.length * parts },
              ].map((r) => (
                <div key={r.labelKey} className="flex justify-between items-center text-gray-600">
                  <span>{t(r.labelKey)}</span>
                  <span className="font-semibold text-[#26272F]">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-700 text-sm">{t('sms.send.sentSuccessfully')}</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t('common.total')}</span><span className="font-medium">{result.total}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>{t('common.paid')}</span><span className="font-medium">{result.sent}</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>{t('sms.overview.failed')}</span><span className="font-medium">{result.failed}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1.5">
            <p className="font-semibold mb-2">{t('sms.send.tips')}</p>
            <p>{t('sms.send.tip1')}</p>
            <p>{t('sms.send.tip2')}</p>
            <p>{t('sms.send.tip3')}</p>
            <p>{t('sms.send.tip4')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendSms;
