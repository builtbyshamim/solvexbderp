import { useState } from 'react';
import {
  Bell, Plus, Play, Trash2, Edit2, ToggleLeft, ToggleRight,
  AlertCircle, CheckCircle, XCircle, Clock, Users, Search,
  Calendar, Filter, TrendingDown
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { smsMarketingApi } from './smsMarketingApi';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const {
  useGetDueRemindersQuery, useCreateDueReminderMutation, useUpdateDueReminderMutation,
  useDeleteDueReminderMutation, useToggleDueReminderMutation,
  useSendDueReminderMutation, useGetDueReminderLogsQuery,
} = smsMarketingApi;

const CHAR_LIMIT = 160;

const VARIABLES = [
  { label: '{name}', desc: 'Customer name' },
  { label: '{amount}', desc: 'Due amount' },
  { label: '{date}', desc: 'Current date' },
  { label: '{shop_name}', desc: 'Your business name' },
];

const emptyForm = {
  name: '',
  message: 'Dear {name}, your account has a due balance of {amount}. Please clear it at your earliest convenience. Thank you.',
  triggerDays: 0,
  minAmount: 0,
  sendToAllDue: true,
};

const DueReminder = () => {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendId, setSendId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');

  const [logSearch, setLogSearch] = useState('');
  const [logStatus, setLogStatus] = useState('');
  const [logPage, setLogPage] = useState(1);

  const { data: reminders = [], isLoading } = useGetDueRemindersQuery(undefined);
  const { data: logsData, isLoading: logsLoading } = useGetDueReminderLogsQuery(
    { search: logSearch, status: logStatus, page: logPage, limit: 20 },
    { skip: activeTab !== 'logs' }
  );

  const [createReminder, { isLoading: isCreating }] = useCreateDueReminderMutation();
  const [updateReminder, { isLoading: isUpdating }] = useUpdateDueReminderMutation();
  const [deleteReminder, { isLoading: isDeleting }] = useDeleteDueReminderMutation();
  const [toggleReminder] = useToggleDueReminderMutation();
  const [sendReminder, { isLoading: isSending }] = useSendDueReminderMutation();

  const logs = logsData ?? [];
  const logMeta = logsData?.meta;
  const charCount = form.message.length;

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({
      name: r.name,
      message: r.message,
      triggerDays: r.triggerDays,
      minAmount: Number(r.minAmount) || 0,
      sendToAllDue: r.sendToAllDue,
    });
    setShowModal(true);
  };

  const insertVariable = (v: string) => {
    setForm(f => ({ ...f, message: f.message + v }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Reminder name is required');
    if (!form.message.trim()) return toast.error('Message is required');
    try {
      if (editId) {
        await updateReminder({ id: editId, ...form }).unwrap();
        toast.success('Reminder updated');
      } else {
        await createReminder(form).unwrap();
        toast.success('Reminder created');
      }
      setShowModal(false);
    } catch { toast.error('Failed to save reminder'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteReminder(deleteId).unwrap();
      toast.success('Reminder deleted');
      setDeleteId(null);
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleReminder(id).unwrap();
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  const handleSend = async () => {
    if (!sendId) return;
    try {
      const res = await sendReminder(sendId).unwrap();
      toast.success(`Reminder sent to ${res.sentCount} customers`);
      setSendId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send reminder');
      setSendId(null);
    }
  };

  const statusConfig: Record<string, { cls: string; icon: React.ReactNode }> = {
    sent: { cls: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
    failed: { cls: 'bg-red-100 text-red-600', icon: <XCircle className="h-3 w-3" /> },
    skipped: { cls: 'bg-gray-100 text-gray-500', icon: <AlertCircle className="h-3 w-3" /> },
  };

  return (
    <div>
      <PageHeader
        title={t('sms.dueReminder.title')}
        subtitle={t('sms.dueReminder.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('sms.overview.title'), path: '/admin/sms-marketing' },
          { label: t('sms.dueReminder.title') },
        ]}
        actions={
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> {t('sms.dueReminder.newReminder')}
          </button>
        }
      />

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <TrendingDown className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold">{t('sms.dueReminder.howItWorks')}</p>
          <p className="text-xs text-blue-600 mt-0.5">{t('sms.dueReminder.howItWorksDesc')} Variables like <code className="bg-blue-100 px-1 rounded">{'{name}'}</code> and <code className="bg-blue-100 px-1 rounded">{'{amount}'}</code> are replaced with actual customer data.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {(['rules', 'logs'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white text-[#26272F] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab === 'rules' ? (
              <span className="flex items-center gap-1.5"><Bell className="h-4 w-4" /> {t('sms.dueReminder.tabRules')}</span>
            ) : (
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {t('sms.dueReminder.tabHistory')}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'rules' ? (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-6 w-6 border-2 border-[#ff6d29] border-t-transparent rounded-full" />
            </div>
          ) : !(reminders as any[]).length ? (
            <div className="bg-white border border-[#DBDFE9] rounded-xl p-16 text-center">
              <div className="h-16 w-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-[#ff6d29]" />
              </div>
              <p className="font-semibold text-[#26272F]">{t('sms.dueReminder.noReminders')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('sms.dueReminder.noRemindersHint')}</p>
              <button onClick={openCreate}
                className="mt-4 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
                {t('sms.dueReminder.createReminder')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(reminders as any[]).map((r: any) => (
                <div key={r.id} className={`bg-white border-2 rounded-xl shadow-sm transition-all hover:shadow-md ${r.isActive ? 'border-[#DBDFE9]' : 'border-gray-200 opacity-70'}`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${r.isActive ? 'bg-orange-50' : 'bg-gray-100'}`}>
                          <Bell className={`h-4 w-4 ${r.isActive ? 'text-[#ff6d29]' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#26272F]">{r.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {r.isActive ? t('sms.dueReminder.active') : t('sms.dueReminder.inactive')}
                            </span>
                            {r.triggerDays > 0 && (
                              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                <Calendar className="h-3 w-3" /> {r.triggerDays}d+ overdue
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleToggle(r.id)}
                          className={`p-1.5 rounded-lg transition-colors ${r.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                          {r.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <button onClick={() => openEdit(r)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setSendId(r.id)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Play className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(r.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-400 mb-1">{t('sms.dueReminder.messagePreview')}</p>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{r.message}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {Number(r.minAmount) > 0 && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Min ৳{Number(r.minAmount).toLocaleString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {r.sendToAllDue ? t('sms.dueReminder.allDueCustomers') : t('sms.dueReminder.filteredCustomers')}
                      </span>
                      {r.totalSent > 0 && (
                        <span className="flex items-center gap-1 ml-auto text-green-600 font-medium">
                          <CheckCircle className="h-3 w-3" /> {r.totalSent} sent
                        </span>
                      )}
                    </div>

                    {r.lastRunAt && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {t('sms.dueReminder.lastRun')} {new Date(r.lastRunAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Send History */
        <>
          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm mb-4">
            <div className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder={t('sms.dueReminder.searchCustomer')} value={logSearch}
                  onChange={(e) => { setLogSearch(e.target.value); setLogPage(1); }}
                  className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400 shrink-0" />
                <select value={logStatus} onChange={(e) => { setLogStatus(e.target.value); setLogPage(1); }}
                  className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] bg-white">
                  {[{ value: '', label: 'All' }, { value: 'sent', label: 'Sent' }, { value: 'failed', label: 'Failed' }, { value: 'skipped', label: 'Skipped' }].map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
            {logsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-[#ff6d29] border-t-transparent rounded-full mx-auto" />
              </div>
            ) : !logs.length ? (
              <div className="p-16 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{t('sms.dueReminder.noLogs')}</p>
                <p className="text-gray-400 text-sm mt-1">{t('sms.dueReminder.noLogsHint')}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                        {[
                          t('sms.dueReminder.colCustomer'),
                          t('sms.dueReminder.colPhone'),
                          t('sms.dueReminder.colDueAmount'),
                          t('sms.dueReminder.colReminder'),
                          t('common.status'),
                          t('sms.logs.colSentAt'),
                        ].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {logs.map((l: any) => {
                        const sc = statusConfig[l.status] ?? statusConfig.sent;
                        return (
                          <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-[#26272F]">{l.customerName}</td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.phone}</td>
                            <td className="px-4 py-3 font-semibold text-red-600">৳{Number(l.dueAmount).toLocaleString()}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{l.reminderName}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sc.cls}`}>
                                {sc.icon} {l.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {l.sentAt ? new Date(l.sentAt).toLocaleString() : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {logMeta && logMeta.totalPages > 1 && (
                  <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between text-sm text-gray-500">
                    <span>{logMeta.totalItems} {t('sms.dueReminder.records')}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1}
                        className="px-3 py-1.5 border border-[#DBDFE9] rounded-lg hover:bg-gray-50 disabled:opacity-40">{t('common.prev')}</button>
                      <span className="px-3 py-1.5 bg-[#ff6d29] text-white rounded-lg">{logPage}</span>
                      <button onClick={() => setLogPage(p => Math.min(logMeta.totalPages, p + 1))} disabled={logPage === logMeta.totalPages}
                        className="px-3 py-1.5 border border-[#DBDFE9] rounded-lg hover:bg-gray-50 disabled:opacity-40">{t('common.next')}</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-[#26272F]">{editId ? t('sms.dueReminder.modalEditTitle') : t('sms.dueReminder.modalCreateTitle')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.dueReminder.reminderName')} <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. 7-Day Due Reminder" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.dueReminder.overdueDays')}</label>
                  <input type="number" min="0" placeholder="0 = send immediately" value={form.triggerDays}
                    onChange={(e) => setForm({ ...form, triggerDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                  <p className="text-xs text-gray-400 mt-1">0 = all due customers</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.dueReminder.minDueAmount')}</label>
                  <input type="number" min="0" placeholder="0 = no minimum" value={form.minAmount}
                    onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-600">{t('sms.send.message')} <span className="text-red-500">*</span></label>
                  <span className={`text-xs ${charCount > CHAR_LIMIT ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                    {charCount}/160
                  </span>
                </div>
                <textarea rows={4} placeholder="Type your reminder message..." value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {VARIABLES.map((v) => (
                    <button key={v.label} onClick={() => insertVariable(v.label)}
                      className="px-2 py-0.5 bg-orange-50 text-[#ff6d29] border border-orange-200 rounded text-xs hover:bg-orange-100 transition-colors font-mono" title={v.desc}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">{t('sms.dueReminder.clickVariables')}</p>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">{t('sms.dueReminder.messagePreview')}</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {form.message
                    .replace('{name}', 'Ahmed Raza')
                    .replace('{amount}', '৳5,000')
                    .replace('{date}', new Date().toLocaleDateString())
                    .replace('{shop_name}', 'BizCore Store')}
                </p>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleSubmit} disabled={isCreating || isUpdating}
                className="px-5 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50">
                {(isCreating || isUpdating) ? t('common.saving') : (editId ? t('common.update') : t('common.create'))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Confirm */}
      {sendId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-50 p-2 rounded-full"><Bell className="h-5 w-5 text-[#ff6d29]" /></div>
              <h2 className="font-bold text-[#26272F]">{t('sms.dueReminder.sendConfirmTitle')}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">{t('sms.dueReminder.sendConfirmMsg')}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSendId(null)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleSend} disabled={isSending}
                className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50">
                <Play className="h-4 w-4" />
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
              <h2 className="font-bold text-[#26272F]">{t('sms.dueReminder.deleteTitle')}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">{t('sms.dueReminder.deleteMsg')}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? t('common.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DueReminder;
