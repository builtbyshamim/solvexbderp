import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, Copy, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import {
  useGetSmsTemplatesQuery,
  useCreateSmsTemplateMutation,
  useUpdateSmsTemplateMutation,
  useDeleteSmsTemplateMutation,
} from './smsMarketingApi';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'greeting', label: 'Greeting' },
  { value: 'offer', label: 'Offer' },
];

const categoryColors: Record<string, string> = {
  promotional: 'bg-orange-100 text-orange-700',
  transactional: 'bg-blue-100 text-blue-700',
  reminder: 'bg-yellow-100 text-yellow-700',
  greeting: 'bg-green-100 text-green-700',
  offer: 'bg-purple-100 text-purple-700',
};

const CHAR_LIMIT = 160;

const emptyForm = { name: '', content: '', category: 'promotional' };

const SmsTemplates = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useGetSmsTemplatesQuery({ search, category, page, limit: 12 });
  const [createTemplate, { isLoading: isCreating }] = useCreateSmsTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateSmsTemplateMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteSmsTemplateMutation();

  const templates = data ?? [];
  const meta = data?.meta;

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (tpl: any) => {
    setEditId(tpl.id);
    setForm({ name: tpl.name, content: tpl.content, category: tpl.category });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Template name is required');
    if (!form.content.trim()) return toast.error('Message content is required');

    try {
      if (editId) {
        await updateTemplate({ id: editId, ...form }).unwrap();
        toast.success('Template updated');
      } else {
        await createTemplate(form).unwrap();
        toast.success('Template created');
      }
      setShowModal(false);
    } catch {
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate(deleteId).unwrap();
      toast.success('Template deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const copyContent = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const charCount = form.content.length;
  const parts = Math.ceil(charCount / CHAR_LIMIT) || 1;

  return (
    <div>
      <PageHeader
        title={t('sms.templates.title')}
        subtitle={t('sms.templates.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('sms.overview.title'), path: '/admin/sms-marketing' },
          { label: t('sms.templates.title') },
        ]}
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
          >
            <Plus className="h-4 w-4" /> {t('sms.templates.newTemplate')}
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('sms.templates.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] bg-white"
          >
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-[#DBDFE9] rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/4 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-3 bg-gray-100 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      ) : !templates.length ? (
        <div className="bg-white border border-[#DBDFE9] rounded-xl p-16 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('sms.templates.noTemplates')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('sms.templates.noTemplatesHint')}</p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]"
          >
            + {t('sms.templates.newTemplate')}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl: any) => (
              <div key={tpl.id} className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-[#26272F] text-sm leading-tight">{tpl.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${categoryColors[tpl.category] || 'bg-gray-100 text-gray-600'}`}>
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{tpl.content}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>{tpl.characterCount} chars</span>
                    <span>·</span>
                    <span>{Math.ceil(tpl.characterCount / CHAR_LIMIT)} part{Math.ceil(tpl.characterCount / CHAR_LIMIT) > 1 ? 's' : ''}</span>
                    {tpl.usageCount > 0 && (
                      <>
                        <span>·</span>
                        <span>Used {tpl.usageCount}×</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-100 p-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => copyContent(tpl.content, tpl.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-50"
                  >
                    {copiedId === tpl.id
                      ? <><CheckCircle className="h-3.5 w-3.5 text-green-500" /> {t('sms.templates.copied')}</>
                      : <><Copy className="h-3.5 w-3.5" /> {t('sms.templates.copy')}</>}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(tpl)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(tpl.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
              <span>{meta.totalItems} {t('sms.templates.title').toLowerCase()}</span>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-[#26272F]">{editId ? t('sms.templates.modalEditTitle') : t('sms.templates.modalCreateTitle')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.templates.templateName')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Eid Offer Message"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('common.category')}</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] bg-white"
                >
                  {CATEGORIES.filter(c => c.value).map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-600">{t('sms.templates.messageContent')} <span className="text-red-500">*</span></label>
                  <span className={`text-xs ${charCount > CHAR_LIMIT ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                    {charCount} chars · {parts} part{parts > 1 ? 's' : ''}
                  </span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Type your message here. Use {name}, {amount}, {date} for personalization."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">Use variables: {'{name}'}, {'{amount}'}, {'{date}'}, {'{shop_name}'}</p>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                {t('common.cancel')}
              </button>
              <button onClick={handleSubmit} disabled={isCreating || isUpdating}
                className="px-5 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50">
                {(isCreating || isUpdating) ? t('sms.campaigns.saving') : (editId ? t('common.update') : t('common.add'))}
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
              <h2 className="font-bold text-[#26272F]">{t('sms.templates.deleteTitle')}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">{t('sms.templates.deleteMsg')}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                {t('common.cancel')}
              </button>
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

export default SmsTemplates;
