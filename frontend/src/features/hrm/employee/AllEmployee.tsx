import { useState } from 'react';
import { Plus, Pencil, Search, Phone, User } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import toast from 'react-hot-toast';

interface Employee {
  id: number;
  employee_code: string;
  name: string;
  phone: string;
  department: string;
  designation: string;
  joining_date: string;
  type: 'full_time' | 'part_time' | 'contract';
  status: 'active' | 'inactive';
  salary: number;
}

const initialEmployees: Employee[] = [
  { id: 1, employee_code: 'EMP-001', name: 'Ahmed Raza', phone: '01711-100001', department: 'Sales', designation: 'Sales Executive', joining_date: '2024-01-15', type: 'full_time', status: 'active', salary: 25000 },
  { id: 2, employee_code: 'EMP-002', name: 'Nusrat Jahan', phone: '01811-100002', department: 'Accounts', designation: 'Accountant', joining_date: '2024-03-01', type: 'full_time', status: 'active', salary: 22000 },
  { id: 3, employee_code: 'EMP-003', name: 'Kamal Hossain', phone: '01911-100003', department: 'Warehouse', designation: 'Store Keeper', joining_date: '2024-05-10', type: 'full_time', status: 'active', salary: 18000 },
  { id: 4, employee_code: 'EMP-004', name: 'Rina Akter', phone: '01611-100004', department: 'Sales', designation: 'Sales Manager', joining_date: '2023-08-20', type: 'full_time', status: 'active', salary: 35000 },
];

const typeColors = { full_time: 'bg-blue-100 text-blue-700', part_time: 'bg-yellow-100 text-yellow-700', contract: 'bg-orange-100 text-orange-600' };

const AllEmployee = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const departments = ['All', ...Array.from(new Set(employees.map((e) => e.department)))];

  const filtered = employees.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.employee_code.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search);
    const matchDept = deptFilter === 'All' || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage employee profiles and records"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'HRM' }, { label: 'Employees' }]}
        actions={
          <button onClick={() => toast.success('Add employee form coming soon')} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Employees', value: employees.length, cls: 'text-[#26272F]' },
          { label: 'Active', value: employees.filter((e) => e.status === 'active').length, cls: 'text-green-600' },
          { label: 'Departments', value: new Set(employees.map((e) => e.department)).size, cls: 'text-blue-600' },
          { label: 'Monthly Payroll', value: `৳${employees.reduce((s, e) => s + e.salary, 0).toLocaleString()}`, cls: 'text-[#ff6d29]' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none">
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Code', 'Employee', 'Department', 'Designation', 'Type', 'Salary', 'Join Date', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  <User className="h-10 w-10 mx-auto mb-2 text-gray-300" />No employees found
                </td></tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.employee_code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#26272F]">{emp.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5"><Phone className="h-3 w-3" />{emp.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{emp.designation}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[emp.type]}`}>{emp.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#26272F]">৳{emp.salary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{emp.joining_date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toast.success('Edit employee coming soon')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllEmployee;
