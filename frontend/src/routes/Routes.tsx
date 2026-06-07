import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import AuthUserNotAccessRoute from '../components/providers/AuthUserNotAccessRoute';
import ProtectedRoute from '../components/providers/ProtectedRoute';
import SuperAdminRoute from '../components/providers/SuperAdminRoute';

// Super Admin
import SuperAdminLogin from '../features/super-admin/SuperAdminLogin';
import SuperAdminDashboard from '../features/super-admin/SuperAdminDashboard';
import BusinessesList from '../features/super-admin/BusinessesList';
import ComingSoonPage from '../features/super-admin/ComingSoonPage';
import PackageManagement from '../features/super-admin/PackageManagement';

// Auth
import LoginPage from '../components/auth/Login';
import ForgotPassword from '../components/auth/ForgotPassword';

// Dashboard
import Dashboard from '../components/dashboard/Dashboard';

// Inventory
import AllProduct from '../features/inventory/products/pages/AllProduct';
import AddProduct from '../features/inventory/products/pages/AddProduct';
import EditProduct from '../features/inventory/products/pages/EditProduct';
import AllCategory from '../features/inventory/category/pages/AllCategory';
import AllBrand from '../features/inventory/brand/AllBrand';
import AllUnit from '../features/inventory/unit/AllUnit';
import AllWarranty from '../features/inventory/warranty/AllWarranty';
import AllWarehouse from '../features/inventory/warehouse/AllWarehouse';
import StockAdjustment from '../features/inventory/stock/StockAdjustment';
import StockTransfer from '../features/inventory/stock/StockTransfer';
import StockReport from '../features/inventory/stock/StockReport';

// Purchase
import AllSupplier from '../features/purchase/supplier/AllSupplier';
import SupplierDetail from '../features/purchase/supplier/SupplierDetail';
import PurchaseList from '../features/purchase/PurchaseList';
import AddPurchase from '../features/purchase/AddPurchase';
import PurchaseReturns from '../features/purchase/PurchaseReturns';
import SupplierLedger from '../features/purchase/SupplierLedger';
import SupplierPayment from '../features/purchase/SupplierPayment';

// Sales
import AllCustomer from '../features/sales/customer/AllCustomer';
import CustomerDetail from '../features/sales/customer/CustomerDetail';
import SaleList from '../features/sales/SaleList';
import AddSale from '../features/sales/AddSale';
import SaleDetail from '../features/sales/SaleDetail';
import SaleReturns from '../features/sales/SaleReturns';
import Quotations from '../features/sales/Quotations';
import CustomerLedger from '../features/sales/CustomerLedger';
import CustomerCollection from '../features/sales/CustomerCollection';
import CollectionReport from '../features/sales/CollectionReport';
import InvoiceA4 from '../features/sales/print/InvoiceA4';
import InvoicePOS from '../features/sales/print/InvoicePOS';

// POS
import POSTerminal from '../features/pos/POSTerminal';

// Accounting
import AllAccounts from '../features/accounting/AllAccounts';
import Transactions from '../features/accounting/Transactions';
import Expenses from '../features/accounting/Expenses';
import Income from '../features/accounting/Income';
import AccountLedger from '../features/accounting/AccountLedger';
import ProfitLoss from '../features/accounting/ProfitLoss';
import BalanceSheet from '../features/accounting/BalanceSheet';
import CashFlow from '../features/accounting/CashFlow';
import TrialBalance from '../features/accounting/TrialBalance';

// HRM
import AllEmployee from '../features/hrm/employee/AllEmployee';
import Departments from '../features/hrm/Departments';
import Designations from '../features/hrm/Designations';
import Attendance from '../features/hrm/Attendance';
import Leave from '../features/hrm/Leave';
import Payroll from '../features/hrm/Payroll';
import Loans from '../features/hrm/Loans';
import KPI from '../features/hrm/KPI';

// Reports
import SalesReport from '../features/reports/SalesReport';
import PurchaseReport from '../features/reports/PurchaseReport';
import StockReportPage from '../features/reports/StockReport';
import ProfitLossReport from '../features/reports/ProfitLossReport';
import CustomerReport from '../features/reports/CustomerReport';
import SupplierReport from '../features/reports/SupplierReport';
import HRMReport from '../features/reports/HRMReport';

// SMS Marketing
import SmsOverview from '../features/sms-marketing/SmsOverview';
import SmsTemplates from '../features/sms-marketing/SmsTemplates';
import SmsCampaigns from '../features/sms-marketing/SmsCampaigns';
import SmsGroups from '../features/sms-marketing/SmsGroups';
import SendSms from '../features/sms-marketing/SendSms';
import SmsLogs from '../features/sms-marketing/SmsLogs';
import SmsConfiguration from '../features/sms-marketing/SmsConfiguration';
import SmsPackages from '../features/sms-marketing/SmsPackages';
import DueReminder from '../features/sms-marketing/DueReminder';

// Settings
import BusinessProfile from '../features/settings/BusinessProfile';
import UsersRoles from '../features/settings/UsersRoles';
import Subscription from '../features/settings/Subscription';
import InvoiceSettings from '../features/settings/InvoiceSettings';

// Affiliate
import MyAffiliate from '../features/affiliate/MyAffiliate';
import AffiliateManagement from '../features/affiliate/AffiliateManagement';
import AffiliateDetail from '../features/affiliate/AffiliateDetail';

// Landing
import LandingPage from '../pages/LandingPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },

  // ── Super Admin area ──────────────────────────────────────────────────────
  {
    path: '/super-admin/login',
    element: <SuperAdminLogin />,
  },
  {
    path: '/super-admin',
    element: (
      <SuperAdminRoute>
        <SuperAdminLayout />
      </SuperAdminRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/super-admin/dashboard" replace /> },
      { path: 'dashboard', element: <SuperAdminDashboard /> },
      { path: 'businesses', element: <BusinessesList /> },
      { path: 'users', element: <ComingSoonPage title="All Users" /> },
      { path: 'subscriptions', element: <ComingSoonPage title="Subscriptions" /> },
      { path: 'packages', element: <PackageManagement /> },
      { path: 'reports', element: <ComingSoonPage title="Platform Reports" /> },
      { path: 'announcements', element: <ComingSoonPage title="Announcements" /> },
      { path: 'settings', element: <ComingSoonPage title="Platform Settings" /> },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // Standalone print pages (no layout, no sidebar)
  {
    path: '/print/invoice/a4/:id',
    element: (
      <ProtectedRoute>
        <InvoiceA4 />
      </ProtectedRoute>
    ),
  },
  {
    path: '/print/invoice/pos/:id',
    element: (
      <ProtectedRoute>
        <InvoicePOS />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <AuthUserNotAccessRoute>
        <LoginPage />
      </AuthUserNotAccessRoute>
    ),
  },
  {
    path: '/auth/forgot-password',
    element: (
      <AuthUserNotAccessRoute>
        <ForgotPassword />
      </AuthUserNotAccessRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },

      // Inventory
      { path: 'inventory/products', element: <AllProduct /> },
      { path: 'inventory/products/add', element: <AddProduct /> },
      { path: 'inventory/products/edit/:id', element: <EditProduct /> },
      { path: 'inventory/categories', element: <AllCategory /> },
      { path: 'inventory/brands', element: <AllBrand /> },
      { path: 'inventory/units', element: <AllUnit /> },
      { path: 'inventory/warranties', element: <AllWarranty /> },
      { path: 'inventory/warehouses', element: <AllWarehouse /> },
      { path: 'inventory/stock-adjustment', element: <StockAdjustment /> },
      { path: 'inventory/stock-transfer', element: <StockTransfer /> },
      { path: 'inventory/stock-report', element: <StockReport /> },

      // Purchase
      { path: 'purchase/suppliers', element: <AllSupplier /> },
      { path: 'purchase/suppliers/:id', element: <SupplierDetail /> },
      { path: 'purchase/list', element: <PurchaseList /> },
      { path: 'purchase/add', element: <AddPurchase /> },
      { path: 'purchase/returns', element: <PurchaseReturns /> },
      { path: 'purchase/supplier-ledger', element: <SupplierLedger /> },
      { path: 'purchase/supplier-payment', element: <SupplierPayment /> },

      // Sales
      { path: 'sales/customers', element: <AllCustomer /> },
      { path: 'sales/customers/:id', element: <CustomerDetail /> },
      { path: 'sales/list', element: <SaleList /> },
      { path: 'sales/add', element: <AddSale /> },
      { path: 'sales/returns', element: <SaleReturns /> },
      { path: 'sales/quotations', element: <Quotations /> },
      { path: 'sales/customer-ledger', element: <CustomerLedger /> },
      { path: 'sales/collection', element: <CustomerCollection /> },
      { path: 'sales/collection-report', element: <CollectionReport /> },
      { path: 'sales/:id', element: <SaleDetail /> },

      // POS
      { path: 'pos', element: <POSTerminal /> },

      // Accounting
      { path: 'accounting/accounts', element: <AllAccounts /> },
      { path: 'accounting/transactions', element: <Transactions /> },
      { path: 'accounting/expenses', element: <Expenses /> },
      { path: 'accounting/income', element: <Income /> },
      { path: 'accounting/ledger', element: <AccountLedger /> },
      { path: 'accounting/profit-loss', element: <ProfitLoss /> },
      { path: 'accounting/balance-sheet', element: <BalanceSheet /> },
      { path: 'accounting/cash-flow', element: <CashFlow /> },
      { path: 'accounting/trial-balance', element: <TrialBalance /> },

      // HRM
      { path: 'hrm/employees', element: <AllEmployee /> },
      { path: 'hrm/departments', element: <Departments /> },
      { path: 'hrm/designations', element: <Designations /> },
      { path: 'hrm/attendance', element: <Attendance /> },
      { path: 'hrm/leave', element: <Leave /> },
      { path: 'hrm/payroll', element: <Payroll /> },
      { path: 'hrm/loans', element: <Loans /> },
      { path: 'hrm/kpi', element: <KPI /> },

      // Reports
      { path: 'reports/sales', element: <SalesReport /> },
      { path: 'reports/purchase', element: <PurchaseReport /> },
      { path: 'reports/stock', element: <StockReportPage /> },
      { path: 'reports/profit-loss', element: <ProfitLossReport /> },
      { path: 'reports/customers', element: <CustomerReport /> },
      { path: 'reports/suppliers', element: <SupplierReport /> },
      { path: 'reports/hrm', element: <HRMReport /> },

      // SMS Marketing
      { path: 'sms-marketing', element: <SmsOverview /> },
      { path: 'sms-marketing/campaigns', element: <SmsCampaigns /> },
      { path: 'sms-marketing/templates', element: <SmsTemplates /> },
      { path: 'sms-marketing/groups', element: <SmsGroups /> },
      { path: 'sms-marketing/send', element: <SendSms /> },
      { path: 'sms-marketing/logs', element: <SmsLogs /> },
      { path: 'sms-marketing/configuration', element: <SmsConfiguration /> },
      { path: 'sms-marketing/packages', element: <SmsPackages /> },
      { path: 'sms-marketing/due-reminder', element: <DueReminder /> },

      // Settings
      { path: 'settings/business', element: <BusinessProfile /> },
      { path: 'settings/users', element: <UsersRoles /> },
      { path: 'settings/subscription', element: <Subscription /> },
      { path: 'settings/invoice', element: <InvoiceSettings /> },
      { path: 'settings/affiliate', element: <MyAffiliate /> },

      // Super Admin - Affiliate
      { path: 'super-admin/affiliates', element: <AffiliateManagement /> },
      { path: 'super-admin/affiliates/:id', element: <AffiliateDetail /> },
    ],
  },
]);

export default router;
