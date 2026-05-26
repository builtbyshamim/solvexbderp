import { useState } from 'react';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';

const usersData = [
  { id: 1, name: 'Admin User', mobile: '01711-000000', role: 'ADMIN', status: 'active', joined: '2025-01-01' },
  { id: 2, name: 'Ahmed Raza', mobile: '01722-111111', role: 'EMPLOYEE', status: 'active', joined: '2025-03-15' },
  { id: 3, name: 'Nusrat Jahan', mobile: '01733-222222', role: 'EMPLOYEE', status: 'active', joined: '2025-04-01' },
  { id: 4, name: 'Kamal Hossain', mobile: '01744-333333', role: 'CASHIER', status: 'inactive', joined: '2025-05-01' },
];

const roleBadge: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  EMPLOYEE: 'bg-blue-100 text-blue-700',
  CASHIER: 'bg-orange-100 text-orange-700',
};

const UsersRoles = () => {
  const [users] = useState(usersData);

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        subtitle="Manage team members and their access permissions"
        breadcrumbs={[{ label: 'Home', path: '/admin' }, { label: 'Settings' }, { label: 'Users & Roles' }]}
        actions={
          <button
            onClick={() => toast.success('Invite user form coming soon')}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]"
          >
            <Plus className="h-4 w-4" /> Invite User
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Users', value: users.length, icon: Shield, cls: 'text-[#26272F]' },
          { label: 'Active Users', value: users.filter((u) => u.status === 'active').length, icon: Shield, cls: 'text-green-600' },
          { label: 'Inactive Users', value: users.filter((u) => u.status === 'inactive').length, icon: Shield, cls: 'text-gray-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#DBDFE9] rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg"><s.icon className="h-5 w-5 text-gray-500" /></div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['Name', 'Mobile', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#26272F]">{user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.mobile}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toast.success('Edit user coming soon')}
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#ff6d29] hover:bg-orange-50 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toast.error('Cannot delete active users')}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-white border border-[#DBDFE9] rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DBDFE9] bg-gray-50">
          <h3 className="text-sm font-semibold text-[#26272F]">Role Permissions</h3>
        </div>
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#DBDFE9]">
                {['Module', 'Admin', 'Employee', 'Cashier'].map((h) => (
                  <th key={h} className="pb-2 text-left font-semibold text-gray-600 pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { module: 'Dashboard', admin: true, employee: true, cashier: true },
                { module: 'Inventory', admin: true, employee: true, cashier: false },
                { module: 'Purchase', admin: true, employee: true, cashier: false },
                { module: 'Sales / POS', admin: true, employee: true, cashier: true },
                { module: 'Accounting', admin: true, employee: false, cashier: false },
                { module: 'HRM', admin: true, employee: false, cashier: false },
                { module: 'Reports', admin: true, employee: false, cashier: false },
                { module: 'Settings', admin: true, employee: false, cashier: false },
              ].map((row) => (
                <tr key={row.module} className="hover:bg-gray-50">
                  <td className="py-2 pr-6 text-gray-700">{row.module}</td>
                  {(['admin', 'employee', 'cashier'] as const).map((role) => (
                    <td key={role} className="py-2 pr-6">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${row[role] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {row[role] ? '✓' : '✗'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersRoles;
