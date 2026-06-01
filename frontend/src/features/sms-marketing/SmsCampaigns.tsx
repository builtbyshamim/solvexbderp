import { useState } from 'react';
import {
  Plus, Search, Send, Trash2, BarChart2, Users, CheckCircle, XCircle,
  Clock, Calendar, Edit2, Play, Filter
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import {
  useGetSmsCampaignsQuery, useGetSmsTemplatesQuery, useGetSmsGroupsQuery,
  useCreateSmsCampaignMutation, useUpdateSmsCampaignMutation,
  useSendSmsCampaignMutation, useDeleteSmsCampaignMutation,
} from './smsMarketingApi';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const statusConfig: Record<string, { cls: string; icon: React.ReactNode }> = {
  draft: { cls: 'bg-gray-100 text-gray-600', icon: <Edit2 className="h-3 w-3" /> },
  scheduled: { cls: 'bg-blue-100 text-blue-700', icon: <Calendar className="h-3 w-3" /> },
  sending: { cls: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
  completed: { cls: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
  failed: { cls: 'bg-red-100 text-red-600', icon: <XCircle className="h-3 w-3" /> },
};

const emptyForm = {
  name: '', description: '', messageContent: '', templateId: '',
  targetType: 'all_customers', recipientNumbers: '', groupId: '', scheduledAt: '',
};

const SmsCampaigns = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendConfirmId, setSendConfirmId] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'sending', label: 'Sending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
  ];

  const { data, isLoading } = useGetSmsCampaignsQuery({ search, status, page, limit: 10 });
  const { data: tplData } = useGetSmsTemplatesQuery({ limit: 100 });
  const { data: groupData } = useGetSmsGroupsQuery({ limit: 100 });
  const [createCampaign, { isLoading: isCreating }] = useCreateSmsCampaignMutation();
  const [updateCampaign, { isLoading: isUpdating }] = useUpdateSmsCampaignMutation();
  const [sendCampaign, { isLoading: isSending }] = useSendSmsCampaignMutation();
  const [deleteCampaign, { isLoading: isDeleting }] = useDeleteSmsCampaignMutation();

  const campaigns = data?.data ?? [];
  const meta = data?.meta;
  const groups = groupData?.data ?? [];
  const templates = tplData?.data ?? [];

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setCharCount(0);
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      description: c.description || '',
      messageContent: c.messageContent,
      templateId: c.templateId || '',
      targetType: c.targetType,
      recipientNumbers: (c.recipientNumbers || []).join(', '),
      groupId: c.groupId || '',
      scheduledAt: c.scheduledAt ? c.scheduledAt.slice(0, 16) : '',
    });
    setCharCount(c.messageContent?.length || 0);
    setShowModal(true);
  };

  const applyTemplate = (tplId: string) => {
    const tpl = templates.find((t: any) => t.id === tplId);
    if (tpl) {
      setForm(f => ({ ...f, templateId: tplId, messageContent: tpl.content }));
      setCharCount(tpl.content.length);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Campaign name is required');
    if (!form.messageContent.trim()) return toast.error('Message content is required');
    if (form.targetType === 'specific_numbers' && !form.recipientNumbers.trim()) {
      return toast.error('Enter at least one phone number for specific targeting');
    }

    const payload: any = {
      name: form.name,
      description: form.description || undefined,
      messageContent: form.messageContent,
      templateId: form.templateId || undefined,
      targetType: form.targetType,
      scheduledAt: form.scheduledAt || undefined,
    };
    if (form.targetType === 'specific_numbers') {
      payload.recipientNumbers = form.recipientNumbers.split(',').map((p: string) => p.trim()).filter(Boolean);
    }
    if (form.targetType === 'group') {
      payload.groupId = (form as any).groupId;
    }

    try {
      if (editId) {
        await updateCampaign({ id: editId, ...payload }).unwrap();
        toast.success('Campaign updated');
      } else {
        await createCampaign(payload).unwrap();
        toast.success('Campaign created');
      }
      setShowModal(false);
    } catch {
      toast.error('Failed to save campaign');
    }
  };

  const handleSend = async () => {
    if (!sendConfirmId) return;
    try {
      const res = await sendCampaign(sendConfirmId).unwrap();
      toast.success(`Sent to ${res.sentCount} of ${res.totalCount} recipients`);
      setSendConfirmId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send campaign');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCampaign(deleteId).unwrap();
      toast.success('Campaign deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete campaign');
    }
  };

  return (
    <div>
      <PageHeader
        title={t('sms.campaigns.title')}
        subtitle={t('sms.campaigns.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('sms.overview.title'), path: '/admin/sms-marketing' },
          { label: t('sms.campaigns.title') },
        ]}
        actions={
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> {t('sms.campaigns.newCampaign')}
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('sms.campaigns.searchPlaceholder')} value={search}
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
        </div>
      </div>

      {/* Campaign List */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-[#ff6d29] border-t-transparent rounded-full mx-auto" />
          </div>
        ) : !campaigns.length ? (
          <div className="p-16 text-center">
            <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t('sms.campaigns.noCampaigns')}</p>
            <button onClick={openCreate}
              className="mt-4 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
              {t('sms.campaigns.createFirst')}
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                    {[
                      t('sms.campaigns.colCampaign'),
                      t('sms.campaigns.colTarget'),
                      t('sms.campaigns.colSent'),
                      t('sms.campaigns.colFailed'),
                      t('sms.campaigns.colRate'),
                      t('common.status'),
                      t('sms.campaigns.colDate'),
                      t('common.actions'),
                    ].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {campaigns.map((c: any) => {
                    const sc = statusConfig[c.status] ?? statusConfig.draft;
                    const rate = c.totalCount > 0 ? Math.round((c.sentCount / c.totalCount) * 100) : 0;
                    const canSend = c.status === 'draft' || c.status === 'scheduled';
                    const canEdit = c.status === 'draft' || c.status === 'scheduled';
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#26272F] max-w-[180px] truncate">{c.name}</p>
                          {c.description && <p className="text-xs text-gray-400 truncate max-w-[180px]">{c.description}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="h-3.5 w-3.5" />
                            <span className="text-xs capitalize">
                              {c.targetType === 'all_customers' ? t('sms.campaigns.allCustomers') : c.targetType === 'group' ? t('sms.campaigns.group') : t('sms.campaigns.specific')}
                            </span>
                          </div>
                          {c.totalCount > 0 && <p className="text-xs text-gray-400 mt-0.5">{c.totalCount} {t('sms.campaigns.recipients')}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-green-600 font-medium">{c.sentCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={c.failedCount > 0 ? 'text-red-500 font-medium' : 'text-gray-400'}>{c.failedCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          {c.status === 'completed' && c.totalCount > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${rate}%` }} />
                              </div>
                              <span className="text-xs text-gray-600">{rate}%</span>
                            </div>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${sc.cls}`}>
                            {sc.icon} {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {c.sentAt
                            ? new Date(c.sentAt).toLocaleDateString()
                            : new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {canSend && (
                              <button onClick={() => setSendConfirmId(c.id)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Send">
                                <Play className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canEdit && (
                              <button onClick={() => openEdit(c)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={() => setDeleteId(c.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between text-sm text-gray-500">
                <span>{meta.totalItems} {t('sms.campaigns.colCampaign').toLowerCase()}s</span>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-[#26272F]">{editId ? t('sms.campaigns.modalEditTitle') : t('sms.campaigns.modalCreateTitle')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.campaigns.campaignName')} <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Eid 2025 Offer" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('common.description')}</label>
                  <input type="text" placeholder="Optional description" value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              </div>

              {templates.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.campaigns.useTemplate')} <span className="text-gray-400">(optional)</span></label>
                  <select value={form.templateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] bg-white">
                    <option value="">{t('sms.campaigns.selectTemplate')}</option>
                    {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-600">{t('sms.overview.message')} <span className="text-red-500">*</span></label>
                  <span className={`text-xs ${charCount > 160 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                    {charCount}/160 · {Math.ceil(charCount / 160) || 1} part(s)
                  </span>
                </div>
                <textarea rows={4} placeholder="Type your message here..."
                  value={form.messageContent}
                  onChange={(e) => { setForm({ ...form, messageContent: e.target.value }); setCharCount(e.target.value.length); }}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.campaigns.targetAudience')} <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all_customers', labelKey: 'sms.campaigns.allCustomersOpt' as const, icon: <Users className="h-4 w-4" /> },
                    { value: 'group', labelKey: 'sms.campaigns.groupOpt' as const, icon: <Users className="h-4 w-4" /> },
                    { value: 'specific_numbers', labelKey: 'sms.campaigns.specificNos' as const, icon: <Send className="h-4 w-4" /> },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm({ ...form, targetType: opt.value })}
                      className={`flex items-center gap-2 p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                        form.targetType === opt.value
                          ? 'border-[#ff6d29] bg-[#ff6d29]/5 text-[#ff6d29]'
                          : 'border-[#DBDFE9] text-gray-600 hover:border-gray-300'
                      }`}>
                      {opt.icon} {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {form.targetType === 'group' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.campaigns.selectGroup')} <span className="text-red-500">*</span></label>
                  <select value={(form as any).groupId || ''} onChange={(e) => setForm({ ...form, ...{ groupId: e.target.value } } as any)}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] bg-white">
                    <option value="">{t('sms.campaigns.chooseGroup')}</option>
                    {(groups as any[]).map((g: any) => <option key={g.id} value={g.id}>{g.name} ({g.memberCount} members)</option>)}
                  </select>
                </div>
              )}

              {form.targetType === 'specific_numbers' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.campaigns.phoneNumbers')} <span className="text-red-500">*</span></label>
                  <textarea rows={3} placeholder="01700000000, 01800000000, 01900000000"
                    value={form.recipientNumbers}
                    onChange={(e) => setForm({ ...form, recipientNumbers: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
                  <p className="text-xs text-gray-400 mt-1">{t('sms.campaigns.separateByCommas')}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.campaigns.schedule')} <span className="text-gray-400">{t('sms.campaigns.scheduleHint')}</span></label>
                <input type="datetime-local" value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleSubmit} disabled={isCreating || isUpdating}
                className="px-5 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50">
                {(isCreating || isUpdating) ? t('sms.campaigns.saving') : (editId ? t('common.update') : t('common.add'))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Confirm */}
      {sendConfirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-50 p-2 rounded-full"><Send className="h-5 w-5 text-green-600" /></div>
              <h2 className="font-bold text-[#26272F]">{t('sms.campaigns.sendConfirmTitle')}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">{t('sms.campaigns.sendConfirmMsg')}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSendConfirmId(null)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleSend} disabled={isSending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {isSending ? t('sms.campaigns.sendingDots') : t('sms.campaigns.yesSendNow')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-50 p-2 rounded-full"><Trash2 className="h-5 w-5 text-red-500" /></div>
              <h2 className="font-bold text-[#26272F]">{t('sms.campaigns.deleteTitle')}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">{t('sms.campaigns.deleteMsg')}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? t('sms.campaigns.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsCampaigns;
