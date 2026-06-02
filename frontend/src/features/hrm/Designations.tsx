import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Briefcase } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import {
  useGetAllEmployeesQuery,
  useGetDesignationsQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
} from './hrmApi';

const FORM_DEFAULT = { name: '', department: '' };

const Designations = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(FORM_DEFAULT);

  const { data, isFetching, error } = useGetDesignationsQuery({});
  const { data: empData } = useGetAllEmployeesQuery({ limit: 500 });
  const [createDesignation, { isLoading: isCreating }] = useCreateDesignationMutation();
  const [updateDesignation, { isLoading: isUpdating }] = useUpdateDesignationMutation();
  const [deleteDesignation, { isLoading: isDeleting }] = useDeleteDesignationMutation();

  const designations = Array.isArray(data) ? data : data?.data || [];
  const employees = empData?.data || [];

  const empCountByDesig = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e: any) => {
      if (e.designation) map[e.designation] = (map[e.designation] || 0) + 1;
    });
    return map;
  }, [employees]);

  // Unique departments from employees for dropdown
  const departments = useMemo(() => {
    return [...new Set(employees.map((e: any) => e.department).filter(Boolean))];
  }, [employees]);

  const filtered = designations.filter((d: any) =>
    d.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => { setEditItem(null); setForm(FORM_DEFAULT); setShowModal(true); };
  const openEdit = (d: any) => { setEditItem(d); setForm({ name: d.name, department: d.department ?? '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Designation name is required'); return; }
    try {
      if (editItem) {
        await updateDesignation({ id: editItem.id, data: form }).unwrap();
        toast.success('Designation updated');
      } else {
        await createDesignation(form).unwrap();
        toast.success('Designation created');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDesignation(id).unwrap();
      toast.success('Designation deleted');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader
        title="Designations"
        subtitle="Manage job designations"
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: 'HRM', path: '/admin/hrm/employees' },
          { label: 'Designations' },
        ]}
        actions={
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> Add Designation
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search designations..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} designations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Designation', 'Department', 'Employees', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" /></div>
                </td></tr>
              ) : (error || filtered.length === 0) ? (
                <tr><td colSpan={5} className="px-4 py-16 text-center">
                  <Briefcase className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-gray-400">No designations yet</p>
                  <button onClick={openAdd} className="mt-3 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
                    Add First Designation
                  </button>
                </td></tr>
              ) : filtered.map((item: any, idx: number) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {empCountByDesig[item.name] ?? item.employees ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} disabled={isDeleting}
                        className="px-3 py-1.5 text-xs border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={isDeleting}
                        className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 flex items-center gap-1 disabled:opacity-50">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">
              {editItem ? 'Edit Designation' : 'Add Designation'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="">Select department...</option>
                  {departments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={isCreating || isUpdating}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {(isCreating || isUpdating) && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {editItem ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Designations;
