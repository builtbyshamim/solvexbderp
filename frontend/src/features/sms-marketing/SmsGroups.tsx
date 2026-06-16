import { useState } from 'react';
import {
  Plus, Search, Users, Trash2, Edit2, UserPlus, Download,
  ChevronRight, Phone, X, Upload, RefreshCw
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { smsMarketingApi } from './smsMarketingApi';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const {
  useGetSmsGroupsQuery, useCreateSmsGroupMutation, useUpdateSmsGroupMutation,
  useDeleteSmsGroupMutation, useGetGroupMembersQuery, useAddGroupMembersMutation,
  useRemoveGroupMemberMutation, useImportCustomersToGroupMutation,
} = smsMarketingApi;

const emptyGroup = { name: '', description: '' };

const SmsGroups = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState(emptyGroup);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberInputs, setMemberInputs] = useState([{ phone: '', name: '' }]);
  const [importConfirm, setImportConfirm] = useState(false);

  const { data: groupsData, isLoading } = useGetSmsGroupsQuery({ search, page, limit: 10 });
  const { data: membersData, isLoading: membersLoading } = useGetGroupMembersQuery(
    { groupId: selectedGroup?.id, search: memberSearch, page: memberPage, limit: 15 },
    { skip: !selectedGroup }
  );

  const [createGroup, { isLoading: isCreating }] = useCreateSmsGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateSmsGroupMutation();
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteSmsGroupMutation();
  const [addMembers, { isLoading: isAdding }] = useAddGroupMembersMutation();
  const [removeMember] = useRemoveGroupMemberMutation();
  const [importCustomers, { isLoading: isImporting }] = useImportCustomersToGroupMutation();

  const groups = groupsData ?? [];
  const groupMeta = groupsData?.meta;
  const members = membersData ?? [];
  const memberMeta = membersData?.meta;

  const openCreate = () => {
    setEditGroupId(null);
    setGroupForm(emptyGroup);
    setShowGroupModal(true);
  };

  const openEdit = (g: any) => {
    setEditGroupId(g.id);
    setGroupForm({ name: g.name, description: g.description || '' });
    setShowGroupModal(true);
  };

  const handleGroupSubmit = async () => {
    if (!groupForm.name.trim()) return toast.error('Group name is required');
    try {
      if (editGroupId) {
        await updateGroup({ id: editGroupId, ...groupForm }).unwrap();
        toast.success('Group updated');
        if (selectedGroup?.id === editGroupId) setSelectedGroup((g: any) => ({ ...g, ...groupForm }));
      } else {
        await createGroup(groupForm).unwrap();
        toast.success('Group created');
      }
      setShowGroupModal(false);
    } catch { toast.error('Failed to save group'); }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupId) return;
    try {
      await deleteGroup(deleteGroupId).unwrap();
      toast.success('Group deleted');
      if (selectedGroup?.id === deleteGroupId) setSelectedGroup(null);
      setDeleteGroupId(null);
    } catch { toast.error('Failed to delete group'); }
  };

  const addMemberInput = () => setMemberInputs([...memberInputs, { phone: '', name: '' }]);
  const removeMemberInput = (i: number) => setMemberInputs(memberInputs.filter((_, idx) => idx !== i));

  const handleAddMembers = async () => {
    const valid = memberInputs.filter((m) => m.phone.trim());
    if (!valid.length) return toast.error('Enter at least one phone number');
    try {
      const res = await addMembers({ groupId: selectedGroup.id, members: valid }).unwrap();
      toast.success(`${res.count} members in group`);
      setShowAddMember(false);
      setMemberInputs([{ phone: '', name: '' }]);
      setSelectedGroup((g: any) => ({ ...g, memberCount: res.count }));
    } catch { toast.error('Failed to add members'); }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember({ groupId: selectedGroup.id, memberId }).unwrap();
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  };

  const handleImport = async () => {
    try {
      const res = await importCustomers(selectedGroup.id).unwrap();
      toast.success(`Imported ${res.count} total members`);
      setImportConfirm(false);
      setSelectedGroup((g: any) => ({ ...g, memberCount: res.count }));
    } catch { toast.error('Failed to import customers'); }
  };

  return (
    <div>
      <PageHeader
        title={t('sms.groups.title')}
        subtitle={t('sms.groups.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('sms.overview.title'), path: '/admin/sms-marketing' },
          { label: t('sms.groups.title') },
        ]}
        actions={
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> {t('sms.groups.newGroup')}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
            <div className="p-4 border-b border-[#DBDFE9]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder={t('sms.groups.searchGroups')} value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-5 w-5 border-2 border-[#ff6d29] border-t-transparent rounded-full mx-auto" />
              </div>
            ) : !groups.length ? (
              <div className="p-10 text-center">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-medium">{t('sms.groups.noGroups')}</p>
                <button onClick={openCreate}
                  className="mt-3 px-3 py-1.5 bg-[#ff6d29] text-white rounded-lg text-xs font-medium hover:bg-[#e65a1f]">
                  {t('sms.groups.createGroup')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {groups.map((g: any) => (
                  <button key={g.id} onClick={() => { setSelectedGroup(g); setMemberPage(1); setMemberSearch(''); }}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 ${selectedGroup?.id === g.id ? 'bg-[#ff6d29]/5 border-l-2 border-[#ff6d29]' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${selectedGroup?.id === g.id ? 'bg-[#ff6d29]/10' : 'bg-gray-100'}`}>
                        <Users className={`h-4 w-4 ${selectedGroup?.id === g.id ? 'text-[#ff6d29]' : 'text-gray-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-medium text-sm truncate ${selectedGroup?.id === g.id ? 'text-[#ff6d29]' : 'text-[#26272F]'}`}>{g.name}</p>
                        {g.description && <p className="text-xs text-gray-400 truncate">{g.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{g.memberCount}</span>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {groupMeta && groupMeta.totalPages > 1 && (
              <div className="p-3 border-t border-[#DBDFE9] flex justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 text-xs border border-[#DBDFE9] rounded hover:bg-gray-50 disabled:opacity-40">{t('common.prev')}</button>
                <span className="px-2 py-1 text-xs bg-[#ff6d29] text-white rounded">{page}</span>
                <button onClick={() => setPage(p => Math.min(groupMeta.totalPages, p + 1))} disabled={page === groupMeta.totalPages}
                  className="px-2 py-1 text-xs border border-[#DBDFE9] rounded hover:bg-gray-50 disabled:opacity-40">{t('common.next')}</button>
              </div>
            )}
          </div>
        </div>

        {/* Members Panel */}
        <div className="lg:col-span-3">
          {!selectedGroup ? (
            <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm p-16 text-center">
              <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">{t('sms.groups.selectGroupPrompt')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('sms.groups.selectGroupHint')}</p>
            </div>
          ) : (
            <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm">
              <div className="p-4 border-b border-[#DBDFE9]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-[#26272F]">{selectedGroup.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedGroup.memberCount} {t('sms.groups.members')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setImportConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#DBDFE9] text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition-colors">
                      <Upload className="h-3.5 w-3.5" /> {t('sms.groups.importCustomers')}
                    </button>
                    <button onClick={() => setShowAddMember(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff6d29] text-white rounded-lg text-xs font-medium hover:bg-[#e65a1f] transition-colors">
                      <UserPlus className="h-3.5 w-3.5" /> {t('sms.groups.addMembers')}
                    </button>
                    <button onClick={() => openEdit(selectedGroup)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteGroupId(selectedGroup.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder={t('sms.groups.searchMembers')} value={memberSearch}
                    onChange={(e) => { setMemberSearch(e.target.value); setMemberPage(1); }}
                    className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              </div>

              {membersLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-5 w-5 border-2 border-[#ff6d29] border-t-transparent rounded-full mx-auto" />
                </div>
              ) : !members.length ? (
                <div className="p-10 text-center">
                  <Phone className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-medium">{t('sms.groups.noMembers')}</p>
                  <p className="text-gray-400 text-xs mt-1">{t('sms.groups.noMembersHint')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {members.map((m: any) => (
                    <div key={m.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-gray-600">
                            {(m.name || m.phone).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          {m.name && <p className="text-sm font-medium text-[#26272F]">{m.name}</p>}
                          <p className="text-xs font-mono text-gray-500">{m.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveMember(m.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {memberMeta && memberMeta.totalPages > 1 && (
                <div className="p-3 border-t border-[#DBDFE9] flex items-center justify-between text-xs text-gray-500">
                  <span>{memberMeta.totalItems} {t('sms.groups.members')}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setMemberPage(p => Math.max(1, p - 1))} disabled={memberPage === 1}
                      className="px-2 py-1 border border-[#DBDFE9] rounded hover:bg-gray-50 disabled:opacity-40">{t('common.prev')}</button>
                    <span className="px-2 py-1 bg-[#ff6d29] text-white rounded">{memberPage}</span>
                    <button onClick={() => setMemberPage(p => Math.min(memberMeta.totalPages, p + 1))} disabled={memberPage === memberMeta.totalPages}
                      className="px-2 py-1 border border-[#DBDFE9] rounded hover:bg-gray-50 disabled:opacity-40">{t('common.next')}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Group Create/Edit Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-[#26272F]">{editGroupId ? t('sms.groups.modalEditTitle') : t('sms.groups.modalCreateTitle')}</h2>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('sms.groups.groupName')} <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. VIP Customers" value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('common.description')}</label>
                <textarea rows={2} placeholder="Optional description" value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleGroupSubmit} disabled={isCreating || isUpdating}
                className="px-5 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50">
                {(isCreating || isUpdating) ? t('sms.campaigns.saving') : (editGroupId ? t('common.update') : t('common.add'))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-[#26272F]">{t('sms.groups.addMembers')} — {selectedGroup?.name}</h2>
              <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-3">
              {memberInputs.map((m, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Phone *" value={m.phone}
                      onChange={(e) => {
                        const arr = [...memberInputs];
                        arr[i].phone = e.target.value;
                        setMemberInputs(arr);
                      }}
                      className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                    <input type="text" placeholder="Name (optional)" value={m.name}
                      onChange={(e) => {
                        const arr = [...memberInputs];
                        arr[i].name = e.target.value;
                        setMemberInputs(arr);
                      }}
                      className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                  </div>
                  {memberInputs.length > 1 && (
                    <button onClick={() => removeMemberInput(i)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addMemberInput}
                className="flex items-center gap-1.5 text-sm text-[#ff6d29] hover:text-[#e65a1f] font-medium">
                <Plus className="h-4 w-4" /> {t('sms.groups.addAnother')}
              </button>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowAddMember(false)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleAddMembers} disabled={isAdding}
                className="px-5 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50">
                {isAdding ? t('sms.groups.adding') : t('sms.groups.addMembers')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirm */}
      {importConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-50 p-2 rounded-full"><Upload className="h-5 w-5 text-blue-600" /></div>
              <h2 className="font-bold text-[#26272F]">{t('sms.groups.importTitle')}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              {t('sms.groups.importMsg')} <strong>{selectedGroup?.name}</strong>. {t('sms.groups.importHint')}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setImportConfirm(false)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleImport} disabled={isImporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {isImporting ? t('sms.groups.importing') : t('sms.groups.import')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirm */}
      {deleteGroupId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-50 p-2 rounded-full"><Trash2 className="h-5 w-5 text-red-500" /></div>
              <h2 className="font-bold text-[#26272F]">{t('sms.groups.deleteTitle')}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">{t('sms.groups.deleteMsg')}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteGroupId(null)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleDeleteGroup} disabled={isDeleting}
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

export default SmsGroups;
