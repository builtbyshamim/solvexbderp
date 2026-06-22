import {
  MdOutlineDashboard,
  MdOutlineInventory2,
  MdOutlinePointOfSale,
  MdOutlineAccountBalance,
  MdOutlineSupervisorAccount,
  MdOutlineShoppingCart,
  MdOutlineLocalShipping,
  MdOutlineSms,
  MdOutlineSettings,
} from 'react-icons/md';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { useLanguage } from '../context/LanguageContext';

type MenuItem = {
  id: number;
  name: string;
  path: string;
  icon: React.ReactNode;
  subMenu?: Array<{ id: number; name: string; path: string }>;
};

export const useDashboardMenuData = () => {
  const { t } = useLanguage();

  const menuItems: MenuItem[] = [
    {
      id: 1,
      name: t('nav.dashboard'),
      path: '/admin',
      icon: <MdOutlineDashboard size={18} />,
    },
    {
      id: 2,
      name: t('nav.inventory'),
      path: '/admin/inventory',
      icon: <MdOutlineInventory2 size={18} />,
      subMenu: [
        { id: 1, name: t('nav.inventory.products'), path: '/admin/inventory/products' },
        { id: 2, name: t('nav.inventory.categories'), path: '/admin/inventory/categories' },
        { id: 3, name: t('nav.inventory.brands'), path: '/admin/inventory/brands' },
        { id: 4, name: t('nav.inventory.units'), path: '/admin/inventory/units' },
        { id: 5, name: t('nav.inventory.warranties'), path: '/admin/inventory/warranties' },
        { id: 6, name: t('nav.inventory.warehouses'), path: '/admin/inventory/warehouses' },
        {
          id: 7,
          name: t('nav.inventory.stockAdjustment'),
          path: '/admin/inventory/stock-adjustment',
        },
        { id: 8, name: t('nav.inventory.stockTransfer'), path: '/admin/inventory/stock-transfer' },
        { id: 9, name: t('nav.inventory.stockLedger'), path: '/admin/inventory/stock-report' },
      ],
    },
    {
      id: 3,
      name: t('nav.purchase'),
      path: '/admin/purchase',
      icon: <MdOutlineLocalShipping size={18} />,
      subMenu: [
        { id: 1, name: t('nav.purchase.suppliers'), path: '/admin/purchase/suppliers' },
        { id: 2, name: t('nav.purchase.purchaseList'), path: '/admin/purchase/list' },
        { id: 3, name: t('nav.purchase.addPurchase'), path: '/admin/purchase/add' },
        { id: 4, name: t('nav.purchase.purchaseReturns'), path: '/admin/purchase/returns' },
        { id: 5, name: t('nav.purchase.supplierLedger'), path: '/admin/purchase/supplier-ledger' },
        {
          id: 6,
          name: t('nav.purchase.supplierPayment'),
          path: '/admin/purchase/supplier-payment',
        },
      ],
    },
    {
      id: 4,
      name: t('nav.sales'),
      path: '/admin/sales',
      icon: <MdOutlineShoppingCart size={18} />,
      subMenu: [
        { id: 1, name: t('nav.sales.customers'), path: '/admin/sales/customers' },
        { id: 9, name: 'Customer Types', path: '/admin/sales/customer-types' },
        { id: 2, name: t('nav.sales.saleList'), path: '/admin/sales/list' },
        { id: 3, name: t('nav.sales.addSale'), path: '/admin/sales/add' },
        { id: 4, name: t('nav.sales.saleReturns'), path: '/admin/sales/returns' },
        { id: 5, name: t('nav.sales.quotations'), path: '/admin/sales/quotations' },
        { id: 6, name: t('nav.sales.customerLedger'), path: '/admin/sales/customer-ledger' },
        { id: 7, name: t('nav.sales.collection'), path: '/admin/sales/collection' },
        { id: 8, name: t('nav.sales.collectionReport'), path: '/admin/sales/collection-report' },
      ],
    },
    {
      id: 5,
      name: t('nav.pos'),
      path: '/admin/pos',
      icon: <MdOutlinePointOfSale size={18} />,
    },
    {
      id: 6,
      name: t('nav.accounting'),
      path: '/admin/accounting',
      icon: <MdOutlineAccountBalance size={18} />,
      subMenu: [
        { id: 1, name: t('nav.accounting.accounts'), path: '/admin/accounting/accounts' },
        { id: 2, name: t('nav.accounting.transactions'), path: '/admin/accounting/transactions' },
        { id: 3, name: t('nav.accounting.expenses'), path: '/admin/accounting/expenses' },
        { id: 4, name: t('nav.accounting.income'), path: '/admin/accounting/income' },
        { id: 5, name: t('nav.accounting.accountLedger'), path: '/admin/accounting/ledger' },
        { id: 6, name: t('nav.accounting.plStatement'), path: '/admin/accounting/profit-loss' },
        { id: 7, name: t('nav.accounting.balanceSheet'), path: '/admin/accounting/balance-sheet' },
        { id: 8, name: t('nav.accounting.cashFlow'), path: '/admin/accounting/cash-flow' },
        { id: 9, name: t('nav.accounting.trialBalance'), path: '/admin/accounting/trial-balance' },
      ],
    },
    {
      id: 7,
      name: t('nav.hrm'),
      path: '/admin/hrm',
      icon: <MdOutlineSupervisorAccount size={18} />,
      subMenu: [
        { id: 1, name: t('nav.hrm.employees'), path: '/admin/hrm/employees' },
        { id: 2, name: t('nav.hrm.departments'), path: '/admin/hrm/departments' },
        { id: 3, name: t('nav.hrm.designations'), path: '/admin/hrm/designations' },
        { id: 4, name: t('nav.hrm.attendance'), path: '/admin/hrm/attendance' },
        { id: 5, name: t('nav.hrm.leave'), path: '/admin/hrm/leave' },
        { id: 6, name: t('nav.hrm.payroll'), path: '/admin/hrm/payroll' },
        { id: 7, name: t('nav.hrm.loansAdvance'), path: '/admin/hrm/loans' },
        { id: 8, name: t('nav.hrm.kpiEvaluation'), path: '/admin/hrm/kpi' },
      ],
    },
    {
      id: 8,
      name: t('nav.reports'),
      path: '/admin/reports',
      icon: <HiOutlineDocumentReport size={18} />,
      subMenu: [
        { id: 1, name: t('nav.reports.salesReport'), path: '/admin/reports/sales' },
        { id: 2, name: t('nav.reports.purchaseReport'), path: '/admin/reports/purchase' },
        { id: 3, name: t('nav.reports.stockReport'), path: '/admin/reports/stock' },
        { id: 9, name: 'Stock Position', path: '/admin/reports/stock-position' },
        { id: 4, name: t('nav.reports.profitLoss'), path: '/admin/reports/profit-loss' },
        { id: 5, name: t('nav.reports.customerReport'), path: '/admin/reports/customers' },
        { id: 8, name: t('nav.reports.topProducts'), path: '/admin/reports/top-products' },
        { id: 6, name: t('nav.reports.supplierReport'), path: '/admin/reports/suppliers' },
        { id: 7, name: t('nav.reports.hrmReport'), path: '/admin/reports/hrm' },
      ],
    },
    {
      id: 9,
      name: t('nav.smsMarketing'),
      path: '/admin/sms-marketing',
      icon: <MdOutlineSms size={18} />,
      subMenu: [
        { id: 1, name: t('nav.smsMarketing.overview'), path: '/admin/sms-marketing' },
        { id: 2, name: t('nav.smsMarketing.campaigns'), path: '/admin/sms-marketing/campaigns' },
        { id: 3, name: t('nav.smsMarketing.groups'), path: '/admin/sms-marketing/groups' },
        { id: 4, name: t('nav.smsMarketing.templates'), path: '/admin/sms-marketing/templates' },
        { id: 5, name: t('nav.smsMarketing.sendSms'), path: '/admin/sms-marketing/send' },
        {
          id: 6,
          name: t('nav.smsMarketing.dueReminder'),
          path: '/admin/sms-marketing/due-reminder',
        },
        {
          id: 10,
          name: t('nav.smsMarketing.notifications'),
          path: '/admin/sms-marketing/notifications',
        },
        { id: 7, name: t('nav.smsMarketing.smsLogs'), path: '/admin/sms-marketing/logs' },
        { id: 8, name: t('nav.smsMarketing.packages'), path: '/admin/sms-marketing/packages' },
        {
          id: 9,
          name: t('nav.smsMarketing.configuration'),
          path: '/admin/sms-marketing/configuration',
        },
      ],
    },
    {
      id: 10,
      name: t('nav.settings'),
      path: '/admin/settings',
      icon: <MdOutlineSettings size={18} />,
      subMenu: [
        { id: 1, name: t('nav.settings.businessProfile'), path: '/admin/settings/business' },
        { id: 2, name: t('nav.settings.usersRoles'), path: '/admin/settings/users' },
        { id: 3, name: t('nav.settings.subscription'), path: '/admin/settings/subscription' },
        { id: 4, name: t('nav.settings.invoiceSettings'), path: '/admin/settings/invoice' },
        { id: 5, name: 'My Affiliate', path: '/admin/settings/affiliate' },
      ],
    },
  ];

  return menuItems;
};
