import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

interface Designation {
  id: number;
  name: string;
  department: string;
  employees: number;
}

const initialDesignations: Designation[] = [
  { id: 1, name: 'Sales Executive', department: 'Sales', employees: 1 },
  { id: 2, name: 'Sales Manager', department: 'Sales', employees: 1 },
  { id: 3, name: 'Accountant', department: 'Accounts', employees: 1 },
  { id: 4, name: 'Store Keeper', department: 'Warehouse', employees: 1 },
  { id: 5, name: 'General Manager', department: 'Management', employees: 1 },
];

const Designations = () => {
  const { t } = useLanguage();
  const [designations, setDesignations] = useState<Designation[]>(initialDesignations);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Designation | null>(null);
  const [form, setForm] = useState({ name: '', department: 'Sales' });

  const filtered = designations.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setEditItem(null); setForm({ name: '', department: 'Sales' }); setShowModal(true); };
  const openEdit = (d: Designation) => { setEditItem(d); setForm({ name: d.name, department: d.department }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (editItem) {
      setDesignations((prev) => prev.map((d) => d.id === editItem.id ? { ...d, ...form } : d));
      toast.success('Designation updated');
    } else {
      setDesignations((prev) => [...prev, { id: Date.now(), ...form, employees: 0 }]);
      toast.success('Designation added');
    }
    setShowModal(false);
  };

  const tableHeaders = [
    '#',
    t('hrm.designations.colDesig'),
    t('hrm.departments.colDept'),
    t('hrm.departments.colEmployees'),
    t('common.actions'),
  ];

  return (
    <div>
      <PageHeader
        title={t('hrm.designations.title')}
        subtitle={t('hrm.designations.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.hrm'), path: '/admin/hrm/employees' },
          { label: t('hrm.designations.title') },
        ]}
        actions={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> {t('hrm.designations.addDesig')}
          </button>
        }
      />
      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('hrm.designations.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
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
                  <td className="px-4 py-3"><span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">{item.department}</span></td>
                  <td className="px-4 py-3 text-gray-600">{item.employees}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => { setDesignations((prev) => prev.filter((d) => d.id !== item.id)); toast.success('Deleted'); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
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
              {editItem ? t('hrm.designations.editTitle') : t('hrm.designations.addTitle')}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('hrm.designations.desigName')} <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sales Executive"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('hrm.departments.colDept')}</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  {['Sales', 'Accounts', 'Warehouse', 'Management', 'IT', 'HR'].map((d) => <option key={d}>{d}</option>)}
                </select>
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
    </div>
  );
};

export default Designations;
