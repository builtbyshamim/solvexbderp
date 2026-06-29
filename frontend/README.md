<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-2-764ABC?style=for-the-badge&logo=redux&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" />
</p>

<h1 align="center">SolvexBD ERP — Frontend</h1>
<p align="center">
  Multi-tenant SaaS ERP Dashboard · React 19 · Vite 7 · Tailwind CSS 4 · RTK Query<br/>
  <strong>Dev URL:</strong> <code>http://localhost:5173</code>
</p>

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Feature Pages](#feature-pages)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Authentication Flow](#authentication-flow)
8. [Routing](#routing)
9. [Bilingual Support](#bilingual-support)
10. [Print System](#print-system)
11. [Environment Variables](#environment-variables)
12. [Installation & Running](#installation--running)

---

## Overview

The SolvexBD ERP frontend is a **React 19** single-page application built with Vite 7 and Tailwind CSS 4. It serves as the main dashboard for business owners and employees to manage inventory, sales, purchases, accounting, HRM, and reports — all under one roof.

A dedicated **Super Admin** interface (separate layout and login) gives platform administrators full control over all registered businesses.

### Key characteristics

- **RTK Query** for all server-state — automatic caching, invalidation, and loading states
- **Cookie-based token storage** — access token and refresh token stored in cookies with correct TTL
- **Automatic token refresh** — the Axios interceptor silently refreshes expired access tokens using the refresh token, then retries the original request
- **Mobile-first responsive** — every page is designed for 320px → 1280px+ screens
- **Bilingual** — English / Bengali toggle built into the layout
- **Print-ready** — A4 invoice and 58mm thermal POS receipt print modes

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS 4 |
| State (server) | Redux Toolkit + RTK Query |
| State (client) | Redux slices + redux-persist |
| HTTP Client | Axios + custom base query |
| Routing | React Router DOM 7 |
| Forms | React Hook Form |
| Notifications | react-hot-toast |
| Icons | Lucide React · React Icons |
| Barcode | JSBarcode |
| Date Handling | Moment.js · react-datepicker |
| Excel Export | SheetJS (xlsx) |
| Rich Text | Jodit React |
| Pagination | react-paginate |

---

## Project Structure

```
frontend/src/
│
├── main.tsx                         # Entry point — Redux Provider, Router, Toaster
│
├── routes/
│   └── Routes.tsx                   # All route definitions (dashboard + super-admin)
│
├── layouts/
│   ├── MainLayout.tsx               # Dashboard shell — sidebar + header + outlet
│   └── SuperAdminLayout.tsx         # Super admin shell — separate nav + outlet
│
├── components/
│   ├── auth/
│   │   └── Login.tsx                # Mobile OTP login + registration (3-step flow)
│   ├── dashboard/                   # Dashboard widgets and summary cards
│   ├── shared/                      # Reusable UI: tables, modals, badges, pagination
│   ├── ui/                          # Base UI primitives
│   └── providers/                   # Context providers (theme, language, etc.)
│
├── features/                        # Feature-sliced modules (each owns its pages + API)
│   ├── inventory/
│   │   ├── products/                # Product list, add, edit, detail, variants
│   │   ├── category/                # Category CRUD
│   │   ├── brand/                   # Brand CRUD
│   │   ├── unit/                    # Unit CRUD
│   │   ├── warehouse/               # Warehouse CRUD
│   │   ├── warranty/                # Warranty CRUD
│   │   └── stock/                   # Ledger, adjustments, transfers
│   │
│   ├── sales/
│   │   ├── SaleList.tsx             # All sales with search/filter/export
│   │   ├── AddSale.tsx              # Create sale invoice
│   │   ├── EditSale.tsx             # Edit draft sale
│   │   ├── SaleDetail.tsx           # Sale detail + print button
│   │   ├── SaleReturns.tsx          # Sale returns list + create
│   │   ├── Quotations.tsx           # Quotations list + convert to sale
│   │   ├── CollectionReport.tsx     # Customer collection summary
│   │   ├── CustomerLedger.tsx       # Per-customer running ledger
│   │   ├── CustomerCollection.tsx   # Collection records
│   │   ├── customer/                # Customer CRUD + types
│   │   ├── print/                   # A4 invoice + 58mm thermal receipt templates
│   │   └── salesApi.ts              # RTK Query endpoints for sales module
│   │
│   ├── purchase/
│   │   ├── PurchaseList.tsx         # All purchases with filters
│   │   ├── AddPurchase.tsx          # Create purchase invoice
│   │   ├── PurchaseDetail.tsx       # Purchase detail view
│   │   ├── PurchaseReturns.tsx      # Return list + create
│   │   ├── SupplierLedger.tsx       # Per-supplier running ledger
│   │   ├── SupplierPayment.tsx      # Supplier payment recording
│   │   ├── supplier/                # Supplier CRUD
│   │   └── purchaseApi.ts           # RTK Query endpoints for purchase module
│   │
│   ├── pos/
│   │   └── POSTerminal.tsx          # Full POS interface — barcode, cart, multi-payment
│   │
│   ├── accounting/
│   │   ├── AllAccounts.tsx          # Account list (cash/bank/mobile banking)
│   │   ├── AccountLedger.tsx        # Per-account double-entry ledger view
│   │   ├── Transactions.tsx         # Manual expense/income entry
│   │   ├── Expenses.tsx             # Expense list and category breakdown
│   │   ├── Income.tsx               # Income list
│   │   ├── ProfitLoss.tsx           # P&L statement
│   │   ├── BalanceSheet.tsx         # Balance sheet
│   │   ├── CashFlow.tsx             # Cash flow statement
│   │   ├── TrialBalance.tsx         # Trial balance
│   │   ├── CategorySelect.tsx       # Accounting category picker
│   │   └── accountingApi.ts         # RTK Query endpoints for accounting
│   │
│   ├── hrm/
│   │   ├── employee/                # Employee list, add, edit, profile
│   │   ├── Departments.tsx          # Department CRUD
│   │   ├── Designations.tsx         # Designation CRUD
│   │   ├── Attendance.tsx           # Attendance register and summary
│   │   ├── Leave.tsx                # Leave requests and approvals
│   │   ├── Payroll.tsx              # Monthly payroll generation and approval
│   │   ├── Loans.tsx                # Employee loans and installments
│   │   ├── KPI.tsx                  # KPI evaluations and ratings
│   │   └── hrmApi.ts                # RTK Query endpoints for HRM
│   │
│   ├── reports/
│   │   ├── SalesReport.tsx          # Sales summary with date/product/customer filter
│   │   ├── PurchaseReport.tsx       # Purchase summary report
│   │   ├── ProfitLossReport.tsx     # P&L report with period comparison
│   │   ├── StockReport.tsx          # Stock movement report
│   │   ├── StockPositionReport.tsx  # Current stock position per warehouse
│   │   ├── TopProductsReport.tsx    # Best-selling products
│   │   ├── CustomerReport.tsx       # Customer activity report
│   │   ├── SupplierReport.tsx       # Supplier activity report
│   │   ├── HRMReport.tsx            # Attendance / payroll summary
│   │   └── reportsApi.ts            # RTK Query endpoints for reports
│   │
│   ├── subscription/
│   │   └── SelectPlan.tsx           # Plan selection after registration
│   │
│   ├── billing/
│   │   └── PaymentRequestModal.tsx  # Submit bKash/Rocket/Nagad payment
│   │
│   ├── settings/
│   │   ├── BusinessProfile.tsx      # Edit business name, logo, address
│   │   ├── InvoiceSettings.tsx      # Customize invoice header/footer
│   │   └── settingsApi.ts
│   │
│   ├── users/
│   │   ├── UsersRoles.tsx           # Manage staff accounts and role/permission overrides
│   │   ├── pages/                   # User detail pages
│   │   └── userApi.ts
│   │
│   ├── affiliate/
│   │   └── mlmApi.ts                # Referral code tracking
│   │
│   ├── sms-marketing/               # SMS campaign management
│   │
│   └── super-admin/
│       ├── SuperAdminLogin.tsx      # Separate super admin login (email + password)
│       ├── SuperAdminDashboard.tsx  # Platform-wide stats
│       ├── BusinessesList.tsx       # All registered businesses
│       ├── PackageManagement.tsx    # Edit subscription packages
│       ├── PaymentRequests.tsx      # Review manual payment requests
│       └── ComingSoonPage.tsx
│
├── redux/
│   ├── store.ts                     # Redux store with redux-persist
│   ├── rootReducer.ts               # Combined reducers
│   ├── tag-types.ts                 # RTK Query tag type registry
│   ├── features/
│   │   ├── authSlice.ts             # { user: AuthUser | null } — setCredentials / clearCredentials
│   │   ├── toggleSlice.ts           # UI toggles (sidebar, modals)
│   │   ├── warehouseSlice.ts        # Active warehouse selection
│   │   └── cartSlice.ts             # POS cart state
│   └── api/
│       ├── baseApi.ts               # RTK Query base with axiosBaseQuery
│       ├── authApi.ts               # Auth endpoints (OTP, login, register, refresh, logout)
│       ├── billingApi.ts            # Payment request endpoints
│       ├── packagesApi.ts           # Subscription package endpoints
│       └── superAdminApi.ts         # Super admin endpoints
│
├── helpers/
│   ├── axiosInstance.ts             # Axios instance with request/response interceptors
│   └── axiosBaseQuery.ts            # RTK Query adapter — unwraps { success, data } envelope
│
├── hooks/
│   ├── useActiveWarehouse.ts        # Returns current warehouse from Redux
│   └── useDebounce.ts               # Debounce hook for search inputs
│
├── locales/
│   ├── en.ts                        # English translations
│   └── bn.ts                        # Bengali translations
│
├── contents/
│   └── token.ts                     # Cookie key names + TTL constants
│
├── context/                         # React context providers
├── types/                           # Global TypeScript type definitions
└── utils/                           # Pure utility functions
```

---

## Feature Pages

### Dashboard
- Revenue today / this month / this year
- Stock value overview
- Recent sales and purchases
- Quick action shortcuts

### Inventory
- Product list with search, filter by category/brand, barcode lookup
- Add / edit product with variant support (size, color, etc.)
- Stock level indicators per warehouse
- Stock adjustment (plus/minus) with reason tracking
- Stock transfer between warehouses
- Category tree, brand, unit, warranty management

### Point of Sale (POS)
- Barcode scan / quick product search
- Cart with quantity, discount per line
- Hold and resume sale
- Multi-payment splits (cash + mobile banking + card)
- Coupon and gift card application
- 58mm thermal receipt on checkout

### Sales
- Invoice creation with line items, discount, tax, profit auto-calculation
- Sale return with stock reversal
- Quotation → convert to invoice in one click
- Customer collection records and ledger view

### Purchase
- Supplier invoice creation with stock auto-update
- Purchase return with supplier credit note
- Supplier running ledger and balance

### Accounting
- Account management (cash, bank, mobile banking)
- Double-entry ledger view per account
- Manual expense / income entry
- Profit & Loss statement, Balance Sheet, Trial Balance, Cash Flow

### HRM
- Employee profiles with department and designation
- Attendance register (manual check-in/out)
- Leave request and approval workflow
- Monthly payroll generation with loan deductions
- KPI evaluations and scoring

### Reports
- Sales, purchase, stock, customer, supplier reports
- Date range filters with export to Excel
- Top products by revenue or quantity
- HRM attendance and payroll summary

### Super Admin
- Platform dashboard with business count, revenue, plan breakdown
- Suspend / unsuspend / renew / change plan per business
- Manual payment request review and approval
- Subscription package CRUD

---

## State Management

### Redux Store

```typescript
// store.ts — persisted with redux-persist
{
  auth:      { user: AuthUser | null },     // logged-in user info
  toggle:    { sidebar: boolean, ... },     // UI state
  warehouse: { activeWarehouseId: string }, // POS / inventory context
  cart:      { items: CartItem[], ... },    // POS cart
  baseApi:   RTKQueryCacheState,            // server cache
}
```

### Auth Slice

```typescript
// setCredentials — called after successful OTP login or mobile register
dispatch(setCredentials({ id, name, role }));

// clearCredentials — called on logout
dispatch(clearCredentials());
```

Server state (products, sales, customers, etc.) lives entirely in RTK Query's cache and is never duplicated into Redux slices.

---

## API Integration

### Axios Instance (`axiosInstance.ts`)

Handles token lifecycle automatically:

1. **Request interceptor** — reads `access_token` cookie, adds `Authorization: Bearer <token>` header
2. **Response interceptor** — on auth endpoints (`/verify-otp`, `/register`, `/refresh`, `/admin-login`), extracts `accessToken` and `refreshToken` from the response and saves them to cookies with correct TTL
3. **401 auto-refresh** — when any request fails with 401, the interceptor silently calls `/auth/refresh` with the stored refresh token, saves new tokens, and retries the original request; all parallel 401s are queued and replayed once refresh completes
4. **Redirect on failure** — if refresh fails (token expired or revoked), clears cookies and redirects to `/login`

### RTK Query Base Query (`axiosBaseQuery.ts`)

```typescript
// Unwraps the backend's TransformInterceptor envelope
return { data: result.data?.data ?? result.data };
```

Every RTK Query hook receives the inner `data` object directly — no need to unwrap `result.data.data` in components.

### Registered API Slices

| File | Module |
|---|---|
| `authApi.ts` | Send OTP, verify OTP, mobile register, admin login, refresh, logout, forgot/reset password |
| `billingApi.ts` | Submit payment request, list own requests |
| `packagesApi.ts` | Fetch available subscription packages |
| `superAdminApi.ts` | Dashboard stats, business management, payment approval |
| Feature-level `*Api.ts` | Inventory, sales, purchase, accounting, HRM, reports (co-located with feature) |

---

## Authentication Flow

### Mobile OTP (3-step UI in `Login.tsx`)

```
Step 1 — Enter mobile number
  → POST /auth/mobile/send-otp
  → Move to Step 2

Step 2 — Enter OTP (dev: 123456)
  → POST /auth/mobile/verify-otp
  → isNewUser: false → dispatch(setCredentials) → navigate('/admin')
  → isNewUser: true  → store tempToken → Move to Step 3

Step 3 — Enter name + password
  → POST /auth/mobile/register
  → dispatch(setCredentials) → navigate('/select-plan')
```

Tokens are saved to cookies automatically by the Axios response interceptor — the component only needs to navigate and dispatch user data to Redux.

### Super Admin Login (`SuperAdminLogin.tsx`)

Separate email + password form → `POST /auth/admin-login`. Super Admin lands on `/super-admin/dashboard` and uses `SuperAdminLayout`.

---

## Routing

```typescript
// Routes.tsx (simplified)
/                     → redirect to /admin or /login
/login                → Login.tsx (OTP flow)
/select-plan          → SelectPlan.tsx

/admin                → MainLayout (requires auth)
  /admin/dashboard
  /admin/inventory/products
  /admin/inventory/categories
  /admin/inventory/stock-adjustment
  /admin/inventory/stock-transfer
  /admin/inventory/warehouses
  /admin/pos
  /admin/sales
  /admin/sales/add
  /admin/sales/returns
  /admin/sales/quotations
  /admin/purchase
  /admin/purchase/add
  /admin/purchase/returns
  /admin/purchase/suppliers
  /admin/accounting/accounts
  /admin/accounting/ledger
  /admin/accounting/transactions
  /admin/accounting/profit-loss
  /admin/accounting/balance-sheet
  /admin/accounting/cash-flow
  /admin/hrm/employees
  /admin/hrm/attendance
  /admin/hrm/leave
  /admin/hrm/payroll
  /admin/reports/*
  /admin/settings/*
  /admin/users

/super-admin/login    → SuperAdminLogin.tsx
/super-admin          → SuperAdminLayout (requires super admin auth)
  /super-admin/dashboard
  /super-admin/businesses
  /super-admin/packages
  /super-admin/payment-requests
```

Protected routes check for a valid `access_token` cookie. If missing, the user is redirected to `/login`.

---

## Bilingual Support

The app ships with English and Bengali translation files:

```typescript
// locales/en.ts
export const en = {
  nav: { dashboard: 'Dashboard', inventory: 'Inventory', ... },
  product: { name: 'Product Name', sku: 'SKU', ... },
  sale: { invoice: 'Invoice', customer: 'Customer', ... },
};

// locales/bn.ts
export const bn = {
  nav: { dashboard: 'ড্যাশবোর্ড', inventory: 'ইনভেন্টরি', ... },
  product: { name: 'পণ্যের নাম', sku: 'এসকেইউ', ... },
  sale: { invoice: 'ইনভয়েস', customer: 'ক্রেতা', ... },
};
```

A language toggle button in the main header layout switches the entire UI instantly without a page reload.

---

## Print System

### A4 Invoice (`/sales/print/`)

- Company logo, name, address, tax number in the header
- Invoice number, date, due date, payment terms
- Customer details box
- Line items table: product · qty · unit price · discount · total
- Subtotal, discount, tax, grand total section
- Payment method and notes
- Footer with thank you message
- `@media print` hides all dashboard UI — only the invoice renders on print

### 58mm Thermal POS Receipt (`POSTerminal.tsx`)

- Fixed width 220px (= 58mm)
- Monospace font, 12px
- Business name centered, bold
- Date and time
- Divider lines (`--------`)
- Items: name left-aligned, price right-aligned
- Grand total in large text
- Payment method
- Thank you message
- Grayscale only (no colors in print)

Both formats open in a `window.open()` print window with `window.print()` triggered automatically.

---

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# Backend API base URL
VITE_PUBLIC_API_URL=http://localhost:5004

# Token TTL (must match backend JWT config, in seconds)
VITE_JWT_ACCESS_TOKEN_TTL=3600      # 1 hour
VITE_JWT_REFRESH_TOKEN_TTL=604800   # 7 days
```

---

## Installation & Running

### Prerequisites

- Node.js 20+
- Backend API running at `http://localhost:5004`

### Development

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Start development server
npm run dev
```

App available at `http://localhost:5173`

### Production Build

```bash
npm run build       # outputs to dist/
npm run preview     # preview production build locally
```

For deployment the `dist/` folder is a static site — serve it with Nginx, Vercel, or any static host.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + production bundle |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint check |

---

## Author

**Md. Shamim Hossain** — Full-Stack Developer

- GitHub: [github.com/shamimhossain515419](https://github.com/shamimhossain515419)
- Email: elias.irozen@gmail.com
