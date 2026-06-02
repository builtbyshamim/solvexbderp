import { useState } from 'react';
import { Search, MessageSquare, CheckCircle, XCircle, Clock, Filter, Download } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useGetSmsLogsQuery } from './smsMarketingApi';
import { useLanguage } from '../../context/LanguageContext';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'sent', label: 'Sent' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];

const statusConfig: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
  sent: { cls: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="h-3 w-3" />, label: 'Sent' },
  delivered: { cls: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" />, label: 'Delivered' },
  failed: { cls: 'bg-red-100 text-red-600', icon: <XCircle className="h-3 w-3" />, label: 'Failed' },
  pending: { cls: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
};

const SmsLogs = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetSmsLogsQuery({ search, status, dateFrom, dateTo, page, limit: 20 });
  const logs = data ?? [];
  const meta = data?.meta;

  const exportCsv = () => {
    if (!logs.length) return;
    const rows = [
      ['Phone', 'Name', 'Campaign', 'Status', 'Sent At', 'Message'],
      ...logs.map((l: any) => [
        l.recipientPhone,
        l.recipientName || '',
        l.campaignName || 'Quick Send',
        l.status,
        l.sentAt ? new Date(l.sentAt).toLocaleString() : '',
        l.messageContent.replace(/,/g, ' '),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title={t('sms.logs.title')}
        subtitle={t('sms.logs.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('sms.overview.title'), path: '/admin/sms-marketing' },
          { label: t('sms.logs.title') },
        ]}
        actions={
          <button onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> {t('sms.logs.exportCsv')}
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('sms.logs.searchPlaceholder')} value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] bg-white">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
            <span className="text-gray-400 text-xs">{t('sms.logs.to')}</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-[#ff6d29] border-t-transparent rounded-full mx-auto" />
          </div>
        ) : !logs.length ? (
          <div className="p-16 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t('sms.logs.noLogs')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('sms.logs.noLogsHint')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                    {[t('sms.logs.colPhone'), t('common.name'), t('sms.logs.colCampaign'), t('sms.logs.colMessage'), t('common.status'), t('sms.logs.colSentAt')].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((l: any) => {
                    const sc = statusConfig[l.status] ?? statusConfig.sent;
                    return (
                      <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm text-[#26272F] font-medium">{l.recipientPhone}</td>
                        <td className="px-4 py-3 text-gray-600">{l.recipientName || '—'}</td>
                        <td className="px-4 py-3">
                          {l.campaignName
                            ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{l.campaignName}</span>
                            : <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{t('sms.logs.quickSend')}</span>}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-gray-600 text-xs truncate">{l.messageContent}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sc.cls}`}>
                            {sc.icon} {sc.label}
                          </span>
                          {l.errorMessage && (
                            <p className="text-xs text-red-400 mt-0.5 max-w-[120px] truncate" title={l.errorMessage}>
                              {l.errorMessage}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {l.sentAt ? new Date(l.sentAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {logs.map((l: any) => {
                const sc = statusConfig[l.status] ?? statusConfig.sent;
                return (
                  <div key={l.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono font-semibold text-sm text-[#26272F]">{l.recipientPhone}</p>
                        {l.recipientName && <p className="text-xs text-gray-500">{l.recipientName}</p>}
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${sc.cls}`}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{l.messageContent}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{l.campaignName || t('sms.logs.quickSend')}</span>
                      <span>{l.sentAt ? new Date(l.sentAt).toLocaleString() : '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between text-sm text-gray-500">
                <span>{meta.totalItems} {t('sms.logs.messages')}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 border border-[#DBDFE9] rounded-lg hover:bg-gray-50 disabled:opacity-40">{t('common.prev')}</button>
                  <span className="px-3 py-1.5 bg-[#ff6d29] text-white rounded-lg">{page}</span>
                  <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                    className="px-3 py-1.5 border border-[#DBDFE9] rounded-lg hover:bg-gray-50 disabled:opacity-40">{t('common.next')}</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SmsLogs;
