import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Phone, User, Loader2 } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import {
  useGetAllEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useTerminateEmployeeMutation,
} from '../hrmApi';

const typeColors: Record<string, string> = {
  full_time: 'bg-blue-100 text-blue-700',
  part_time: 'bg-yellow-100 text-yellow-700',
  contract: 'bg-orange-100 text-orange-600',
  intern: 'bg-purple-100 text-purple-700',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  terminated: 'bg-red-100 text-red-600',
  on_leave: 'bg-yellow-100 text-yellow-700',
};

const emptyForm = {
  name: '', mobile: '', email: '', department: '', designation: '',
  joiningDate: '', employmentType: 'full_time',
  basicSalary: '', houseRent: '', medicalAllowance: '', transportAllowance: '',
};

const AllEmployee = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [terminateItem, setTerminateItem] = useState<any>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useGetAllEmployeesQuery({ search: debouncedSearch, page, limit: 15 });
  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation();
  const [terminateEmployee, { isLoading: terminating }] = useTerminateEmployeeMutation();

  const employees = data?.data ?? [];
  const meta = data?.meta;

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name, mobile: item.mobile ?? '', email: item.email ?? '',
      department: item.department ?? '', designation: item.designation ?? '',
      joiningDate: item.joiningDate?.slice(0, 10) ?? '',
      employmentType: item.employmentType ?? 'full_time',
      basicSalary: item.basicSalary ?? '', houseRent: item.houseRent ?? '',
      medicalAllowance: item.medicalAllowance ?? '', transportAllowance: item.transportAllowance ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.joiningDate) { toast.error('Name and joining date are required'); return; }
    const payload: any = {
      name: form.name, mobile: form.mobile, email: form.email,
      department: form.department, designation: form.designation,
      joiningDate: form.joiningDate, employmentType: form.employmentType,
      basicSalary: form.basicSalary ? Number(form.basicSalary) : 0,
      houseRent: form.houseRent ? Number(form.houseRent) : 0,
      medicalAllowance: form.medicalAllowance ? Number(form.medicalAllowance) : 0,
      transportAllowance: form.transportAllowance ? Number(form.transportAllowance) : 0,
    };
    try {
      if (editItem) {
        await updateEmployee({ id: editItem.id, data: payload }).unwrap();
        toast.success('Employee updated');
      } else {
        await createEmployee(payload).unwrap();
        toast.success('Employee added');
      }
      setShowModal(false);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to save employee');
    }
  };

  const handleTerminate = async () => {
    if (!terminateItem) return;
    try {
      await terminateEmployee(terminateItem.id).unwrap();
      toast.success('Employee terminated');
      setTerminateItem(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to terminate employee');
    }
  };

  const f = (key: keyof typeof form, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your workforce"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'HRM', path: '/admin/hrm' }, { label: 'Employees' }]}
        actions={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Employees', value: meta?.totalItems ?? 0, color: 'text-[#26272F]' },
          { label: 'Active', value: employees.filter((e: any) => e.status === 'active').length, color: 'text-green-600' },
          { label: 'On Leave', value: employees.filter((e: any) => e.status === 'on_leave').length, color: 'text-yellow-600' },
          { label: 'Terminated', value: employees.filter((e: any) => e.status === 'terminated').length, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <span className="text-sm text-gray-500">{isFetching ? 'Loading...' : `${meta?.totalItems ?? 0} employees`}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Code', 'Employee', 'Department', 'Salary', 'Type', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" /></td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No employees found</td></tr>
              ) : (
                employees.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.employeeCode}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#ff6d29]/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-[#ff6d29]" />
                        </div>
                        <div>
                          <div className="font-medium text-[#26272F]">{item.name}</div>
                          {item.mobile && <div className="flex items-center gap-1 text-xs text-gray-400"><Phone className="h-3 w-3" />{item.mobile}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[#26272F]">{item.department || '—'}</div>
                      <div className="text-xs text-gray-400">{item.designation || ''}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">৳{Number(item.basicSalary).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[item.employmentType] ?? 'bg-gray-100 text-gray-500'}`}>
                        {item.employmentType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {item.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                        {item.status !== 'terminated' && (
                          <button onClick={() => setTerminateItem(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {meta.currentPage} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">{editItem ? 'Edit Employee' : 'Add Employee'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Full name"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input value={form.mobile} onChange={e => f('mobile', e.target.value)} placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input value={form.department} onChange={e => f('department', e.target.value)} placeholder="e.g. Sales"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input value={form.designation} onChange={e => f('designation', e.target.value)} placeholder="e.g. Manager"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.joiningDate} onChange={e => f('joiningDate', e.target.value)}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select value={form.employmentType} onChange={e => f('employmentType', e.target.value)}
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                <input type="number" min="0" value={form.basicSalary} onChange={e => f('basicSalary', e.target.value)} placeholder="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Rent</label>
                <input type="number" min="0" value={form.houseRent} onChange={e => f('houseRent', e.target.value)} placeholder="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
                <input type="number" min="0" value={form.medicalAllowance} onChange={e => f('medicalAllowance', e.target.value)} placeholder="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance</label>
                <input type="number" min="0" value={form.transportAllowance} onChange={e => f('transportAllowance', e.target.value)} placeholder="0"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={creating || updating} className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {(creating || updating) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editItem ? 'Update' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {terminateItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="h-6 w-6 text-red-500" /></div>
            <h3 className="text-lg font-semibold mb-2">Terminate Employee?</h3>
            <p className="text-sm text-gray-500 mb-6"><span className="font-medium">{terminateItem.name}</span> will be marked as terminated.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setTerminateItem(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm">Cancel</button>
              <button onClick={handleTerminate} disabled={terminating} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60 flex items-center gap-2">
                {terminating && <Loader2 className="h-4 w-4 animate-spin" />} Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllEmployee;
