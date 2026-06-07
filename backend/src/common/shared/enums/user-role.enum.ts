export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  EMPLOYEE = 'employee',
}

export enum Permission {
  // Inventory
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_CREATE = 'inventory:create',
  INVENTORY_EDIT = 'inventory:edit',
  INVENTORY_DELETE = 'inventory:delete',

  // Products
  PRODUCT_VIEW = 'product:view',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_EDIT = 'product:edit',
  PRODUCT_DELETE = 'product:delete',

  // Stock
  STOCK_VIEW = 'stock:view',
  STOCK_ADJUST = 'stock:adjust',
  STOCK_TRANSFER = 'stock:transfer',

  // Warehouse
  WAREHOUSE_VIEW = 'warehouse:view',
  WAREHOUSE_CREATE = 'warehouse:create',
  WAREHOUSE_EDIT = 'warehouse:edit',
  WAREHOUSE_DELETE = 'warehouse:delete',

  // Purchase
  PURCHASE_VIEW = 'purchase:view',
  PURCHASE_CREATE = 'purchase:create',
  PURCHASE_EDIT = 'purchase:edit',
  PURCHASE_DELETE = 'purchase:delete',

  // Sales
  SALES_VIEW = 'sales:view',
  SALES_CREATE = 'sales:create',
  SALES_EDIT = 'sales:edit',
  SALES_DELETE = 'sales:delete',

  // POS
  POS_ACCESS = 'pos:access',
  POS_DISCOUNT = 'pos:discount',
  POS_RETURN = 'pos:return',

  // HRM
  HRM_VIEW = 'hrm:view',
  HRM_CREATE = 'hrm:create',
  HRM_EDIT = 'hrm:edit',
  HRM_DELETE = 'hrm:delete',
  HRM_PAYROLL = 'hrm:payroll',
  HRM_ATTENDANCE = 'hrm:attendance',

  // Accounting
  ACCOUNTING_VIEW = 'accounting:view',
  ACCOUNTING_CREATE = 'accounting:create',
  ACCOUNTING_EDIT = 'accounting:edit',
  ACCOUNTING_DELETE = 'accounting:delete',

  // Reports
  REPORTS_VIEW = 'reports:view',
  REPORTS_EXPORT = 'reports:export',

  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',

  // Users
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',
  USERS_MANAGE_ROLES = 'users:manage_roles',

  // Customers
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_EDIT = 'customer:edit',
  CUSTOMER_DELETE = 'customer:delete',

  // Suppliers
  SUPPLIER_VIEW = 'supplier:view',
  SUPPLIER_CREATE = 'supplier:create',
  SUPPLIER_EDIT = 'supplier:edit',
  SUPPLIER_DELETE = 'supplier:delete',
}
