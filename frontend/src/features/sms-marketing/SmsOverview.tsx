import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, BarChart2, FileText, TrendingUp, CheckCircle,
  XCircle, Clock, ChevronRight, Zap, Users, Plus
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useGetSmsStatsQuery } from './smsMarketingApi';
import { useQuickSendSmsMutation } from './smsMarketingApi';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
};

const SmsOverview = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useGetSmsStatsQuery(undefined);
  const [quickSend, { isLoading: isSending }] = useQuickSendSmsMutation();

  const [quickForm, setQuickForm] = useState({ phones: '', message: '' });
  const [charCount, setCharCount] = useState(0);

  const handleQuickSend = async () => {
    const phones = quickForm.phones.split(',').map((p) => p.trim()).filter(Boolean);
    if (!phones.length) return toast.error('Enter at least one phone number');
    if (!quickForm.message.trim()) return toast.error('Message cannot be empty');

    try {
      const res = await quickSend({ phoneNumbers: phones, message: quickForm.message }).unwrap();
      toast.success(`Sent to ${res.sentCount} of ${res.totalCount} recipients`);
      setQuickForm({ phones: '', message: '' });
      setCharCount(0);
    } catch {
      toast.error('Failed to send SMS');
    }
  };

  const statsCards = [
    {
      label: 'Total Sent',
      value: isLoading ? '—' : (stats?.totalSent ?? 0).toLocaleString(),
      icon: <Send className="h-5 w-5" />,
      cls: 'text-blue-700 bg-blue-50 border-blue-200',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Delivery Rate',
      value: isLoading ? '—' : `${stats?.deliveryRate ?? 0}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      cls: 'text-green-700 bg-green-50 border-green-200',
      iconBg: 'bg-green-100',
    },
    {
      label: 'Failed',
      value: isLoading ? '—' : (stats?.totalFailed ?? 0).toLocaleString(),
      icon: <XCircle className="h-5 w-5" />,
      cls: 'text-red-600 bg-red-50 border-red-200',
      iconBg: 'bg-red-100',
    },
    {
      label: 'Campaigns',
      value: isLoading ? '—' : (stats?.totalCampaigns ?? 0).toLocaleString(),
      icon: <BarChart2 className="h-5 w-5" />,
      cls: 'text-orange-700 bg-orange-50 border-orange-200',
      iconBg: 'bg-orange-100',
    },
    {
      label: 'Templates',
      value: isLoading ? '—' : (stats?.totalTemplates ?? 0).toLocaleString(),
      icon: <FileText className="h-5 w-5" />,
      cls: 'text-purple-700 bg-purple-50 border-purple-200',
      iconBg: 'bg-purple-100',
    },
  ];

  const quickLinks = [
    { label: 'New Campaign', icon: <Plus className="h-4 w-4" />, path: '/admin/sms-marketing/campaigns', color: 'bg-[#ff6d29] text-white hover:bg-[#e65a1f]' },
    { label: 'Templates', icon: <FileText className="h-4 w-4" />, path: '/admin/sms-marketing/templates', color: 'bg-white text-gray-700 border border-[#DBDFE9] hover:bg-gray-50' },
    { label: 'All Campaigns', icon: <BarChart2 className="h-4 w-4" />, path: '/admin/sms-marketing/campaigns', color: 'bg-white text-gray-700 border border-[#DBDFE9] hover:bg-gray-50' },
    { label: 'SMS Logs', icon: <MessageSquare className="h-4 w-4" />, path: '/admin/sms-marketing/logs', color: 'bg-white text-gray-700 border border-[#DBDFE9] hover:bg-gray-50' },
  ];

  return (
    <div>
      <PageHeader
        title="SMS Marketing"
        subtitle="Manage campaigns, templates and track SMS delivery"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'SMS Marketing' }]}
        actions={
          <button
            onClick={() => navigate('/admin/sms-marketing/campaigns')}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
          >
            <Plus className="h-4 w-4" /> New Campaign
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {statsCards.map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 flex items-center gap-3 ${s.cls}`}>
            <div className={`${s.iconBg} p-2 rounded-lg`}>{s.icon}</div>
            <div>
              <p className="text-xs font-medium opacity-70">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Send Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
            <div className="p-4 border-b border-[#DBDFE9] flex items-center gap-2">
              <div className="bg-[#ff6d29]/10 p-1.5 rounded-lg">
                <Zap className="h-4 w-4 text-[#ff6d29]" />
              </div>
              <h2 className="font-semibold text-[#26272F]">Quick Send</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Phone Numbers <span className="text-gray-400">(comma separated)</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="01700000000, 01800000000"
                    value={quickForm.phones}
                    onChange={(e) => setQuickForm({ ...quickForm, phones: e.target.value })}
                    className="pl-9 pr-3 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-600">Message</label>
                  <span className={`text-xs ${charCount > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                    {charCount}/160 {charCount > 160 && `(${Math.ceil(charCount / 160)} parts)`}
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Type your SMS message here..."
                  value={quickForm.message}
                  onChange={(e) => {
                    setQuickForm({ ...quickForm, message: e.target.value });
                    setCharCount(e.target.value.length);
                  }}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none"
                />
              </div>
              <button
                onClick={handleQuickSend}
                disabled={isSending || !quickForm.phones || !quickForm.message}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {isSending ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-4 bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
            <div className="p-4 border-b border-[#DBDFE9]">
              <h2 className="font-semibold text-[#26272F]">Quick Links</h2>
            </div>
            <div className="p-3 space-y-2">
              {quickLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => navigate(link.path)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${link.color}`}
                >
                  {link.icon}
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm h-full">
            <div className="p-4 border-b border-[#DBDFE9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-purple-50 p-1.5 rounded-lg">
                  <BarChart2 className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="font-semibold text-[#26272F]">Recent Campaigns</h2>
              </div>
              <button
                onClick={() => navigate('/admin/sms-marketing/campaigns')}
                className="text-xs text-[#ff6d29] hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-[#ff6d29] border-t-transparent rounded-full mx-auto" />
                </div>
              ) : !stats?.recentCampaigns?.length ? (
                <div className="p-12 text-center">
                  <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No campaigns yet</p>
                  <button
                    onClick={() => navigate('/admin/sms-marketing/campaigns')}
                    className="mt-3 px-4 py-1.5 bg-[#ff6d29] text-white rounded-lg text-xs font-medium hover:bg-[#e65a1f]"
                  >
                    Create First Campaign
                  </button>
                </div>
              ) : (
                stats.recentCampaigns.map((c: any) => (
                  <div key={c.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-[#26272F] text-sm truncate">{c.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${statusColors[c.status]}`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-2">{c.messageContent}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {c.totalCount} recipients
                          </span>
                          {c.sentCount > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" /> {c.sentCount} sent
                            </span>
                          )}
                          {c.failedCount > 0 && (
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle className="h-3 w-3" /> {c.failedCount} failed
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">
                          {c.sentAt
                            ? new Date(c.sentAt).toLocaleDateString()
                            : new Date(c.createdAt).toLocaleDateString()}
                        </p>
                        {c.status === 'completed' && c.totalCount > 0 && (
                          <p className="text-xs font-semibold text-green-600 mt-1">
                            {Math.round((c.sentCount / c.totalCount) * 100)}% delivered
                          </p>
                        )}
                      </div>
                    </div>
                    {c.status === 'completed' && c.totalCount > 0 && (
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${(c.sentCount / c.totalCount) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsOverview;
