import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

interface Department {
  id: number;
  name: string;
  head: string;
  employees: number;
  description: string;
}

const initialDepts: Department[] = [
  { id: 1, name: 'Sales', head: 'Rina Akter', employees: 2, description: 'Sales and business development' },
  { id: 2, name: 'Accounts', head: 'Nusrat Jahan', employees: 1, description: 'Finance and accounting' },
  { id: 3, name: 'Warehouse', head: 'Kamal Hossain', employees: 1, description: 'Inventory management' },
  { id: 4, name: 'Management', head: 'Admin', employees: 1, description: 'Administration and management' },
];

const Departments = () => {
  const { t } = useLanguage();
  const [depts, setDepts] = useState<Department[]>(initialDepts);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', head: '', description: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = depts.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditItem(null); setForm({ name: '', head: '', description: '' }); setShowModal(true); };
  const openEdit = (d: Department) => { setEditItem(d); setForm({ name: d.name, head: d.head, description: d.description }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (editItem) {
      setDepts((prev) => prev.map((d) => d.id === editItem.id ? { ...d, ...form } : d));
      toast.success('Department updated');
    } else {
      setDepts((prev) => [...prev, { id: Date.now(), ...form, employees: 0 }]);
      toast.success('Department added');
    }
    setShowModal(false);
  };

  const tableHeaders = [
    '#',
    t('hrm.departments.colDept'),
    t('hrm.departments.colHead'),
    t('hrm.departments.colEmployees'),
    t('common.description'),
    t('common.actions'),
  ];

  return (
    <div>
      <PageHeader
        title={t('hrm.departments.title')}
        subtitle={t('hrm.departments.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.hrm'), path: '/admin/hrm/employees' },
          { label: t('hrm.departments.title') },
        ]}
        actions={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> {t('hrm.departments.addDept')}
          </button>
        }
      />
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('hrm.departments.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {tableHeaders.map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.head}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {item.employees} {t('hrm.departments.employeesCount')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
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
              {editItem ? t('hrm.departments.editTitle') : t('hrm.departments.addTitle')}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('hrm.departments.deptName')} <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sales"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('hrm.departments.deptHead')}</label>
                <input type="text" value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })} placeholder="Head name"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description')}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
                {editItem ? t('common.update') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="h-6 w-6 text-red-500" /></div>
            <h3 className="text-lg font-semibold mb-2">{t('hrm.departments.deleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-6">{t('hrm.departments.deleteWarning')}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm">{t('common.cancel')}</button>
              <button onClick={() => { setDepts((prev) => prev.filter((d) => d.id !== deleteId)); setDeleteId(null); toast.success('Deleted'); }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
