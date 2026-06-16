import { Permission, UserRole } from '../shared/enums/user-role.enum';

const ALL_PERMISSIONS = Object.values(Permission);

const MANAGER_PERMISSIONS: Permission[] = [
  Permission.INVENTORY_VIEW,
  Permission.INVENTORY_CREATE,
  Permission.INVENTORY_EDIT,
  Permission.PRODUCT_VIEW,
  Permission.PRODUCT_CREATE,
  Permission.PRODUCT_EDIT,
  Permission.STOCK_VIEW,
  Permission.STOCK_ADJUST,
  Permission.STOCK_TRANSFER,
  Permission.WAREHOUSE_VIEW,
  Permission.PURCHASE_VIEW,
  Permission.PURCHASE_CREATE,
  Permission.PURCHASE_EDIT,
  Permission.SALES_VIEW,
  Permission.SALES_CREATE,
  Permission.SALES_EDIT,
  Permission.POS_ACCESS,
  Permission.POS_DISCOUNT,
  Permission.POS_RETURN,
  Permission.HRM_VIEW,
  Permission.HRM_CREATE,
  Permission.HRM_EDIT,
  Permission.HRM_ATTENDANCE,
  Permission.ACCOUNTING_VIEW,
  Permission.ACCOUNTING_CREATE,
  Permission.REPORTS_VIEW,
  Permission.REPORTS_EXPORT,
  Permission.SETTINGS_VIEW,
  Permission.USERS_VIEW,
  Permission.CUSTOMER_VIEW,
  Permission.CUSTOMER_CREATE,
  Permission.CUSTOMER_EDIT,
  Permission.SUPPLIER_VIEW,
  Permission.SUPPLIER_CREATE,
  Permission.SUPPLIER_EDIT,
];

const CASHIER_PERMISSIONS: Permission[] = [
  Permission.PRODUCT_VIEW,
  Permission.STOCK_VIEW,
  Permission.SALES_VIEW,
  Permission.SALES_CREATE,
  Permission.POS_ACCESS,
  Permission.POS_DISCOUNT,
  Permission.CUSTOMER_VIEW,
  Permission.CUSTOMER_CREATE,
  Permission.REPORTS_VIEW,
];

const EMPLOYEE_PERMISSIONS: Permission[] = [
  Permission.INVENTORY_VIEW,
  Permission.PRODUCT_VIEW,
  Permission.STOCK_VIEW,
  Permission.PURCHASE_VIEW,
  Permission.SALES_VIEW,
  Permission.CUSTOMER_VIEW,
  Permission.SUPPLIER_VIEW,
  Permission.REPORTS_VIEW,
  Permission.HRM_VIEW,
  Permission.HRM_ATTENDANCE,
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: ALL_PERMISSIONS,
  [UserRole.SUPER_ADMIN]: ALL_PERMISSIONS,
  [UserRole.MANAGER]: MANAGER_PERMISSIONS,
  [UserRole.CASHIER]: CASHIER_PERMISSIONS,
  [UserRole.EMPLOYEE]: EMPLOYEE_PERMISSIONS,
};

export function getEffectivePermissions(
  role: UserRole,
  customPermissions: Permission[] = [],
): Permission[] {
  const rolePerms = ROLE_PERMISSIONS[role] ?? [];
  const merged = new Set([...rolePerms, ...customPermissions]);
  return Array.from(merged);
}

export function hasPermission(
  role: UserRole,
  customPermissions: Permission[],
  required: Permission[],
): boolean {
  if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) return true;
  const effective = getEffectivePermissions(role, customPermissions);
  const set = new Set(effective);
  return required.every((p) => set.has(p));
}
