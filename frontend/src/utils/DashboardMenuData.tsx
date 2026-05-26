import {
  MdOutlineDashboard,
  MdOutlineInventory2,
  MdOutlinePointOfSale,
  MdOutlineAccountBalance,
  MdOutlinePeople,
  MdOutlineShoppingCart,
  MdOutlineStorefront,
  MdOutlineAssessment,
  MdOutlineSettings,
  MdOutlineSupervisorAccount,
  MdOutlineWarehouse,
  MdOutlineCategory,
  MdOutlineLocalShipping,
} from 'react-icons/md';
import { FaUsers, FaMoneyBillWave } from 'react-icons/fa';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { BsBoxSeam, BsGraphUp } from 'react-icons/bs';

type MenuItem = {
  id: number;
  name: string;
  path: string;
  icon: React.ReactNode;
  subMenu?: Array<{ id: number; name: string; path: string }>;
};

export const useDashboardMenuData = () => {
  const menuItems: MenuItem[] = [
    {
      id: 1,
      name: 'Dashboard',
      path: '/admin',
      icon: <MdOutlineDashboard size={18} />,
    },
    {
      id: 2,
      name: 'Inventory',
      path: '/admin/inventory',
      icon: <MdOutlineInventory2 size={18} />,
      subMenu: [
        { id: 1, name: 'Products', path: '/admin/inventory/products' },
        { id: 2, name: 'Categories', path: '/admin/inventory/categories' },
        { id: 3, name: 'Brands', path: '/admin/inventory/brands' },
        { id: 4, name: 'Units', path: '/admin/inventory/units' },
        { id: 5, name: 'Warranties', path: '/admin/inventory/warranties' },
        { id: 6, name: 'Warehouses', path: '/admin/inventory/warehouses' },
        { id: 7, name: 'Stock Adjustment', path: '/admin/inventory/stock-adjustment' },
        { id: 8, name: 'Stock Transfer', path: '/admin/inventory/stock-transfer' },
        { id: 9, name: 'Stock Ledger', path: '/admin/inventory/stock-report' },
      ],
    },
    {
      id: 3,
      name: 'Purchase',
      path: '/admin/purchase',
      icon: <MdOutlineLocalShipping size={18} />,
      subMenu: [
        { id: 1, name: 'Suppliers', path: '/admin/purchase/suppliers' },
        { id: 2, name: 'Purchase List', path: '/admin/purchase/list' },
        { id: 3, name: 'Add Purchase', path: '/admin/purchase/add' },
        { id: 4, name: 'Purchase Returns', path: '/admin/purchase/returns' },
        { id: 5, name: 'Supplier Ledger', path: '/admin/purchase/supplier-ledger' },
      ],
    },
    {
      id: 4,
      name: 'Sales',
      path: '/admin/sales',
      icon: <MdOutlineShoppingCart size={18} />,
      subMenu: [
        { id: 1, name: 'Customers', path: '/admin/sales/customers' },
        { id: 2, name: 'Sale List', path: '/admin/sales/list' },
        { id: 3, name: 'Add Sale', path: '/admin/sales/add' },
        { id: 4, name: 'Sale Returns', path: '/admin/sales/returns' },
        { id: 5, name: 'Quotations', path: '/admin/sales/quotations' },
        { id: 6, name: 'Customer Ledger', path: '/admin/sales/customer-ledger' },
      ],
    },
    {
      id: 5,
      name: 'POS',
      path: '/admin/pos',
      icon: <MdOutlinePointOfSale size={18} />,
    },
    {
      id: 6,
      name: 'Accounting',
      path: '/admin/accounting',
      icon: <MdOutlineAccountBalance size={18} />,
      subMenu: [
        { id: 1, name: 'Accounts', path: '/admin/accounting/accounts' },
        { id: 2, name: 'Transactions', path: '/admin/accounting/transactions' },
        { id: 3, name: 'Expenses', path: '/admin/accounting/expenses' },
        { id: 4, name: 'Income', path: '/admin/accounting/income' },
        { id: 5, name: 'Account Ledger', path: '/admin/accounting/ledger' },
        { id: 6, name: 'P&L Statement', path: '/admin/accounting/profit-loss' },
        { id: 7, name: 'Balance Sheet', path: '/admin/accounting/balance-sheet' },
        { id: 8, name: 'Cash Flow', path: '/admin/accounting/cash-flow' },
        { id: 9, name: 'Trial Balance', path: '/admin/accounting/trial-balance' },
      ],
    },
    {
      id: 7,
      name: 'HRM',
      path: '/admin/hrm',
      icon: <MdOutlineSupervisorAccount size={18} />,
      subMenu: [
        { id: 1, name: 'Employees', path: '/admin/hrm/employees' },
        { id: 2, name: 'Departments', path: '/admin/hrm/departments' },
        { id: 3, name: 'Designations', path: '/admin/hrm/designations' },
        { id: 4, name: 'Attendance', path: '/admin/hrm/attendance' },
        { id: 5, name: 'Leave', path: '/admin/hrm/leave' },
        { id: 6, name: 'Payroll', path: '/admin/hrm/payroll' },
        { id: 7, name: 'Loans & Advance', path: '/admin/hrm/loans' },
        { id: 8, name: 'KPI Evaluation', path: '/admin/hrm/kpi' },
      ],
    },
    {
      id: 8,
      name: 'Reports',
      path: '/admin/reports',
      icon: <HiOutlineDocumentReport size={18} />,
      subMenu: [
        { id: 1, name: 'Sales Report', path: '/admin/reports/sales' },
        { id: 2, name: 'Purchase Report', path: '/admin/reports/purchase' },
        { id: 3, name: 'Stock Report', path: '/admin/reports/stock' },
        { id: 4, name: 'Profit & Loss', path: '/admin/reports/profit-loss' },
        { id: 5, name: 'Customer Report', path: '/admin/reports/customers' },
        { id: 6, name: 'Supplier Report', path: '/admin/reports/suppliers' },
        { id: 7, name: 'HRM Report', path: '/admin/reports/hrm' },
      ],
    },
    {
      id: 9,
      name: 'Settings',
      path: '/admin/settings',
      icon: <MdOutlineSettings size={18} />,
      subMenu: [
        { id: 1, name: 'Business Profile', path: '/admin/settings/business' },
        { id: 2, name: 'Users & Roles', path: '/admin/settings/users' },
        { id: 3, name: 'Subscription', path: '/admin/settings/subscription' },
        { id: 4, name: 'Invoice Settings', path: '/admin/settings/invoice' },
      ],
    },
  ];

  return menuItems;
};
