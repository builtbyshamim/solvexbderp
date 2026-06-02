import { useState } from 'react';
import {
  Plus,
  Trash2,
  Shield,
  Search,
  Settings2,
  X,
  ChevronDown,
  Eye,
  EyeOff,
  UserPlus,
  CheckSquare,
  Square,
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import {
  useGetAllUserQuery,
  useDeleteUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserPermissionsMutation,
  useInviteUserMutation,
  useGetRolePermissionsQuery,
} from '../users/userApi';
import CommonPagination from '../../components/ui/paginations/CommonPagination';
import { useDebounce } from '../../hooks/useDebounce';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'admin' | 'manager' | 'cashier' | 'employee';

interface User {
  id: string;
  name?: string;
  email?: string;
  mobile?: string;
  role: Role;
  customPermissions: string[] | null;
  isVerified?: boolean;
  isBanned?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  businessId?: string | null;
}

interface RolePermission {
  role: string;
  permissions: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES: { value: Role; label: string; color: string }[] = [
  { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'manager', label: 'Manager', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'cashier', label: 'Cashier', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'employee', label: 'Employee', color: 'bg-orange-100 text-orange-700 border-orange-200' },
];

const PERMISSION_GROUPS: { label: string; prefix: string; perms: { key: string; label: string }[] }[] = [
  {
    label: 'Inventory', prefix: 'inventory',
    perms: [
      { key: 'inventory:view', label: 'View' },
      { key: 'inventory:create', label: 'Create' },
      { key: 'inventory:edit', label: 'Edit' },
      { key: 'inventory:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Products', prefix: 'product',
    perms: [
      { key: 'product:view', label: 'View' },
      { key: 'product:create', label: 'Create' },
      { key: 'product:edit', label: 'Edit' },
      { key: 'product:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Stock', prefix: 'stock',
    perms: [
      { key: 'stock:view', label: 'View' },
      { key: 'stock:adjust', label: 'Adjust' },
      { key: 'stock:transfer', label: 'Transfer' },
    ],
  },
  {
    label: 'Warehouse', prefix: 'warehouse',
    perms: [
      { key: 'warehouse:view', label: 'View' },
      { key: 'warehouse:create', label: 'Create' },
      { key: 'warehouse:edit', label: 'Edit' },
      { key: 'warehouse:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Purchase', prefix: 'purchase',
    perms: [
      { key: 'purchase:view', label: 'View' },
      { key: 'purchase:create', label: 'Create' },
      { key: 'purchase:edit', label: 'Edit' },
      { key: 'purchase:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Sales', prefix: 'sales',
    perms: [
      { key: 'sales:view', label: 'View' },
      { key: 'sales:create', label: 'Create' },
      { key: 'sales:edit', label: 'Edit' },
      { key: 'sales:delete', label: 'Delete' },
    ],
  },
  {
    label: 'POS', prefix: 'pos',
    perms: [
      { key: 'pos:access', label: 'Access POS' },
      { key: 'pos:discount', label: 'Apply Discount' },
      { key: 'pos:return', label: 'Process Return' },
    ],
  },
  {
    label: 'HRM', prefix: 'hrm',
    perms: [
      { key: 'hrm:view', label: 'View' },
      { key: 'hrm:create', label: 'Create' },
      { key: 'hrm:edit', label: 'Edit' },
      { key: 'hrm:delete', label: 'Delete' },
      { key: 'hrm:payroll', label: 'Payroll' },
      { key: 'hrm:attendance', label: 'Attendance' },
    ],
  },
  {
    label: 'Accounting', prefix: 'accounting',
    perms: [
      { key: 'accounting:view', label: 'View' },
      { key: 'accounting:create', label: 'Create' },
      { key: 'accounting:edit', label: 'Edit' },
      { key: 'accounting:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Reports', prefix: 'reports',
    perms: [
      { key: 'reports:view', label: 'View' },
      { key: 'reports:export', label: 'Export' },
    ],
  },
  {
    label: 'Customers', prefix: 'customer',
    perms: [
      { key: 'customer:view', label: 'View' },
      { key: 'customer:create', label: 'Create' },
      { key: 'customer:edit', label: 'Edit' },
      { key: 'customer:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Suppliers', prefix: 'supplier',
    perms: [
      { key: 'supplier:view', label: 'View' },
      { key: 'supplier:create', label: 'Create' },
      { key: 'supplier:edit', label: 'Edit' },
      { key: 'supplier:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Users & Roles', prefix: 'users',
    perms: [
      { key: 'users:view', label: 'View' },
      { key: 'users:create', label: 'Create' },
      { key: 'users:edit', label: 'Edit' },
      { key: 'users:delete', label: 'Delete' },
      { key: 'users:manage_roles', label: 'Manage Roles' },
    ],
  },
  {
    label: 'Settings', prefix: 'settings',
    perms: [
      { key: 'settings:view', label: 'View' },
      { key: 'settings:edit', label: 'Edit' },
    ],
  },
];

function getRoleMeta(role: string) {
  return ROLES.find((r) => r.value === role) ?? ROLES[3];
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', role: 'employee' as Role });
  const [showPw, setShowPw] = useState(false);
  const [inviteUser, { isLoading }] = useInviteUserMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteUser(form).unwrap();
      toast.success('Staff member added successfully');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to invite user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#ff6d29]" />
            <h2 className="font-semibold text-[#26272F]">Add Staff Member</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
              placeholder="John Doe" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
              placeholder="staff@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
              placeholder="01700000000" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <div className="relative">
              <input required type={showPw ? 'text' : 'password'} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
                placeholder="Min. 6 characters" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
              {ROLES.filter((r) => r.value !== 'admin').map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e55c1e] disabled:opacity-50">
              {isLoading ? 'Adding...' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Permissions Modal ────────────────────────────────────────────────────────

function PermissionsModal({
  user,
  rolePermissionsMap,
  onClose,
}: {
  user: User;
  rolePermissionsMap: RolePermission[];
  onClose: () => void;
}) {
  const roleDefaults = rolePermissionsMap.find((r) => r.role === user.role)?.permissions ?? [];
  const [selected, setSelected] = useState<Set<string>>(
    new Set([...roleDefaults, ...(user.customPermissions ?? [])]),
  );
  const [updatePermissions, { isLoading }] = useUpdateUserPermissionsMutation();

  const toggle = (perm: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const toggleGroup = (perms: string[]) => {
    const allOn = perms.every((p) => selected.has(p));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) perms.forEach((p) => next.delete(p));
      else perms.forEach((p) => next.add(p));
      return next;
    });
  };

  const resetToRoleDefaults = () => setSelected(new Set(roleDefaults));

  const handleSave = async () => {
    // Only save permissions that differ from role defaults (custom overrides)
    const custom = Array.from(selected).filter((p) => !roleDefaults.includes(p));
    // Also include role default perms that were explicitly removed — stored as exclusion is complex,
    // so we store the full effective list as custom permissions
    const fullList = Array.from(selected);
    try {
      await updatePermissions({ id: user.id, permissions: fullList }).unwrap();
      toast.success('Permissions saved');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save permissions');
    }
  };

  const roleMeta = getRoleMeta(user.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-[#ff6d29]" />
              <h2 className="font-semibold text-[#26272F]">Manage Permissions</h2>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{user.name ?? user.email}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleMeta.color}`}>
                {roleMeta.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#ff6d29]/20 border border-[#ff6d29]/40 inline-block" />
              Role default
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-300 inline-block" />
              Custom grant
            </span>
          </div>
          <button onClick={resetToRoleDefaults}
            className="text-xs text-[#ff6d29] hover:underline font-medium">
            Reset to role defaults
          </button>
        </div>

        {/* Permissions grid */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {PERMISSION_GROUPS.map((group) => {
            const groupKeys = group.perms.map((p) => p.key);
            const allSelected = groupKeys.every((k) => selected.has(k));
            const someSelected = groupKeys.some((k) => selected.has(k));

            return (
              <div key={group.prefix} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGroup(groupKeys)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-sm text-gray-700">{group.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {groupKeys.filter((k) => selected.has(k)).length}/{groupKeys.length}
                    </span>
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-[#ff6d29]" />
                    ) : someSelected ? (
                      <CheckSquare className="h-4 w-4 text-gray-300" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-300" />
                    )}
                  </div>
                </button>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100">
                  {group.perms.map((perm) => {
                    const isOn = selected.has(perm.key);
                    const isDefault = roleDefaults.includes(perm.key);
                    return (
                      <button
                        key={perm.key}
                        onClick={() => toggle(perm.key)}
                        className={`flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                          isOn
                            ? isDefault
                              ? 'bg-[#ff6d29]/10 text-[#ff6d29]'
                              : 'bg-blue-50 text-blue-700'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {isOn ? (
                          <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                        )}
                        {perm.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e55c1e] disabled:opacity-50">
            {isLoading ? 'Saving...' : `Save Permissions (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const UsersRoles = () => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState({ search: '', limit: 10, page: 1 });
  const debouncedSearch = useDebounce(searchValue.search, 500);
  const [permUser, setPermUser] = useState<User | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const { data, isFetching } = useGetAllUserQuery({
    ...searchValue,
    search: debouncedSearch,
  });
  const { data: rolePermsData } = useGetRolePermissionsQuery({});
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();

  const users: User[] = data?.data || data?.data || [];
  const meta = data?.meta || { totalItems: 0, totalPages: 1 };
  const rolePermissionsMap: RolePermission[] = rolePermsData?.data ?? rolePermsData ?? [];

  const handleDelete = async (id: string, name?: string) => {
    if (!window.confirm(`Remove ${name ?? 'this user'}?`)) return;
    try {
      await deleteUser(id).unwrap();
      toast.success('User removed');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete');
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await updateRole({ id, role }).unwrap();
      toast.success('Role updated');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div>
      <PageHeader
        title={t('settings.usersRoles.title')}
        subtitle={t('settings.usersRoles.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.settings') },
          { label: t('settings.usersRoles.title') },
        ]}
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, mobile..."
              value={searchValue.search}
              onChange={(e) => setSearchValue({ ...searchValue, search: e.target.value, page: 1 })}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{meta.totalItems} users</span>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e55c1e] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Staff
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'User', 'Mobile', 'Role', 'Status', 'Joined', 'Permissions', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                    <Shield className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className="font-medium">No users found</p>
                    <p className="text-xs mt-1">Add staff members to get started</p>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => {
                  const roleMeta = getRoleMeta(user.role);
                  const customCount = user.customPermissions?.length ?? 0;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {(searchValue.page - 1) * searchValue.limit + idx + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-[#26272F]">{user.name ?? '—'}</div>
                        <div className="text-xs text-gray-400">{user.email ?? ''}</div>
                      </td>

                      <td className="px-4 py-3 text-gray-600">{user.mobile ?? '—'}</td>

                      <td className="px-4 py-3">
                        <div className="relative inline-block">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={isUpdatingRole || user.role === 'admin'}
                            className={`appearance-none pl-2.5 pr-7 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed ${roleMeta.color}`}
                          >
                            {ROLES.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.isBanned
                            ? 'bg-red-100 text-red-700'
                            : user.isVerified
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {user.isBanned ? 'Banned' : user.isVerified ? 'Active' : 'Pending'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => setPermUser(user)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#ff6d29] border border-[#ff6d29]/30 rounded-lg hover:bg-[#ff6d29]/5 transition-colors"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          Manage
                          {customCount > 0 && (
                            <span className="ml-0.5 px-1.5 py-0.5 bg-[#ff6d29] text-white rounded-full text-[10px] leading-none">
                              {customCount}
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={isDeleting || user.role === 'admin'}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title={user.role === 'admin' ? 'Cannot remove admin' : 'Remove user'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <CommonPagination
            total={meta.totalItems}
            totalPage={meta.totalPages}
            setSearchValue={setSearchValue}
            searchValue={searchValue}
            limit={searchValue.limit}
            page={searchValue.page}
          />
        )}
      </div>

      {/* Role legend cards */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map((role) => {
          const perms = rolePermissionsMap.find((r) => r.role === role.value)?.permissions ?? [];
          return (
            <div key={role.value} className="bg-white border border-[#DBDFE9] rounded-lg p-4">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mb-3 ${role.color}`}>
                <Shield className="h-3 w-3" />
                {role.label}
              </div>
              <p className="text-xs text-gray-500">
                {perms.length} default permissions
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {role.value === 'admin'
                  ? 'Full system access'
                  : role.value === 'manager'
                  ? 'Manage operations'
                  : role.value === 'cashier'
                  ? 'POS & sales only'
                  : 'View & attendance only'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {permUser && (
        <PermissionsModal
          user={permUser}
          rolePermissionsMap={rolePermissionsMap}
          onClose={() => setPermUser(null)}
        />
      )}
    </div>
  );
};

export default UsersRoles;
