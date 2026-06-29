<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeORM-0.3-FE0902?style=for-the-badge" />
</p>

<h1 align="center">SolvexBD ERP</h1>
<p align="center">
  <strong>Enterprise-grade Multi-tenant SaaS ERP for Bangladeshi businesses</strong><br/>
  Inventory · POS · HRM · Accounting · Subscription · Super Admin
</p>

<p align="center">
  <a href="https://solvexbd-erp.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live_Demo-solvexbd--erp.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
</p>

---

## Live Demo

**URL:** [https://solvexbd-erp.vercel.app/](https://solvexbd-erp.vercel.app/)

### Super Admin Login

> Super Admin has a dedicated login route with a separate JWT secret.

| Field | Value |
|---|---|
| Login URL | [https://solvexbd-erp.vercel.app/super-admin/login](https://solvexbd-erp.vercel.app/super-admin/login) |
| Email | `admin@gmail.com` |
| Password | `Admin1234@` |

### Regular Business Login (OTP)

| Field | Value |
|---|---|
| Login URL | [https://solvexbd-erp.vercel.app/login](https://solvexbd-erp.vercel.app/login) |
| Mobile | Any valid BD number (e.g. `01617650797`) |
| OTP | `123456` (fixed in development mode) |

> New mobile numbers auto-register a business with a 15-day free trial.
> Returning numbers are logged in directly — no password needed.

---

## Overview

SolvexBD ERP is a production-ready, multi-tenant SaaS platform where each registered business gets a fully isolated workspace. Built for **5,000+ concurrent shops**, it covers everything a small-to-medium Bangladeshi business needs — from stock management and point-of-sale billing to payroll processing and double-entry accounting.

Every monetary value is stored as `DECIMAL(15,2)`, every stock quantity as `DECIMAL(15,4)`, and every financial transaction is enforced through a **double-entry ledger** — zero rounding errors, zero data loss.

---

## Key Features

### Multi-tenancy & Security
- Row-level tenant isolation via `business_id` on every data table
- JWT-based auth with **access token + refresh token** rotation
- **Mobile-number-first** OTP login — no email required for end users
- Role-based access control: `super_admin`, `admin`, `employee`
- Separate Super Admin JWT secret — cannot be spoofed by tenant tokens
- Helmet, rate limiting, and IP tracking on all sensitive endpoints

### Subscription System
- **15-day free trial** auto-created on registration
- Two paid plans (Starter / Pro) with enforced limits on users and products
- Super Admin can renew, upgrade, suspend, unsuspend, or extend trials
- Full audit log (`subscription_audit_log`) for every plan action

### Inventory Management
- Products with variants, SKU, barcode generation
- Categories (tree), Units, Brands, Warranties
- Warehouse management with default warehouse logic
- Append-only **Stock Ledger** — every movement is traceable
- Stock adjustments (plus/minus) and warehouse transfers
- Real-time available stock vs reserved stock tracking

### Point of Sale (POS)
- Fast billing with barcode scan support
- Hold / resume sale
- Multi-payment splits (cash, mobile banking, card)
- Coupon and gift card support
- A4 invoice print + 58mm thermal receipt (POS printer)

### Purchase Management
- Supplier CRUD with running ledger and balance tracking
- Purchase invoices with line items, discount, tax
- Stock IN automatically recorded to ledger on purchase
- Purchase returns with supplier credit and stock reversal

### Sales Management
- Customer CRUD with ledger, balance, and aging reports
- Sales invoices with profit calculation per line item
- Sale returns with stock reversal and refund processing
- Quotations that can be converted directly to sales

### Accounting (Double-Entry)
- Cash, Bank, and Mobile Banking accounts
- Every financial event creates two ledger rows (debit + credit)
- `sum(debit) === sum(credit)` enforced before every commit
- **Petty Cash account auto-created** for every new business on registration
- Reports: P&L, Balance Sheet, Trial Balance, Cash Flow, Account Statement

### HRM
- Full employee profiles with departments and designations
- Attendance tracking (manual, QR, device integration)
- Leave types, requests, and approval workflow
- Payroll structure, generation, approval, and payslip export
- Loan and advance tracking with installment deduction from payroll
- KPI evaluation and ratings
- Exit management with final settlement

### Super Admin Panel
- Platform-wide business list with subscription status
- Subscription control (renew, change plan, suspend, unsuspend, extend trial)
- Company data reset with scoped deletion (transactions / inventory / HRM / all)
- System health dashboard (DB connections, Redis memory, queue depth)
- SMS marketing and announcement broadcast
- Full audit trail on all Super Admin actions

### Affiliate & Billing
- Referral code system with tracking
- Payment request flow (bKash / Rocket / Nagad)
- Manual payment review and approval by admin

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20 LTS |
| **Backend Framework** | NestJS 11 |
| **ORM** | TypeORM 0.3 |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 (ioredis) |
| **Auth** | JWT (access + refresh) · OTP via SMS |
| **Validation** | class-validator · class-transformer · DTOs |
| **API Docs** | Swagger / OpenAPI 3 |
| **File Storage** | AWS S3 · ImageKit |
| **Email** | Nodemailer |
| **Frontend Framework** | React 19 (Vite) |
| **State Management** | Redux Toolkit + RTK Query |
| **UI** | Tailwind CSS 4 |
| **Forms** | React Hook Form |
| **Routing** | React Router DOM 7 |
| **Barcode** | JSBarcode |
| **Excel Export** | SheetJS (xlsx) |
| **Containerization** | Docker + Docker Compose |
| **Reverse Proxy** | Nginx |
| **Process Manager** | PM2 |

---

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│                        CLIENTS                         │
│      Browser (React 19)     ·     POS Terminal         │
└───────────────────┬────────────────────────────────────┘
                    │ HTTPS
┌───────────────────▼────────────────────────────────────┐
│                  Nginx Reverse Proxy                    │
└──────────┬──────────────────────────┬──────────────────┘
           │                          │
┌──────────▼──────────┐    ┌──────────▼──────────┐
│   NestJS API        │    │   React Frontend     │
│   Port 3001         │    │   Port 3000 (Vite)   │
└──────────┬──────────┘    └─────────────────────┘
           │
┌──────────┼──────────────────────────┐
│          │                          │
▼          ▼                          ▼
PostgreSQL 16    Redis 7         AWS S3 / ImageKit
(Primary DB)     (Cache/Session)  (File Storage)
```

### Multi-tenancy Model

Every tenant table carries a `business_id` (UUID). A `TenantBaseEntity` abstract class enforces this at the ORM level. A JWT guard injects `business_id` from the token on every authenticated request — tenants are physically isolated at the row level within a shared schema.

---

## Project Structure

```
solvexbd-erp/
│
├── backend/                          # NestJS 11 API
│   └── src/
│       ├── common/
│       │   ├── decorators/           # @CurrentUser, @BusinessId, @Roles
│       │   ├── entities/             # TenantBaseEntity (abstract)
│       │   ├── filters/              # Global exception filter
│       │   ├── guards/               # JwtAuthGuard, RolesGuard
│       │   ├── interceptors/         # ResponseInterceptor
│       │   └── pipes/                # ValidationPipe config
│       │
│       └── modules/
│           ├── auth/                 # OTP, JWT, refresh token, mobile register
│           ├── users/                # User profiles, roles, permissions
│           ├── business/             # Business setup
│           ├── billing/              # Payment requests, bKash/Rocket/Nagad
│           ├── subscription/         # Plans, trial, limits
│           ├── packages/             # Package definitions
│           ├── super-admin/          # Platform control panel
│           ├── accounting/           # Accounts, double-entry ledger
│           ├── reports/              # P&L, Balance Sheet, Cash Flow
│           ├── inventory/
│           │   ├── product/          # Products, variants, SKU, barcode
│           │   ├── stock/            # Ledger, adjustment, transfer
│           │   ├── category/         # Tree categories
│           │   ├── brand/
│           │   ├── unit/
│           │   ├── warehouse/
│           │   └── warranty/
│           ├── purchase/             # Suppliers, purchases, returns
│           ├── sales/                # Customers, sales, returns, quotations, POS
│           ├── hrm/                  # Employees, attendance, leave, payroll, KPI
│           ├── affiliate/            # Referral codes, tracking
│           ├── sms-marketing/        # SMS campaigns
│           ├── image-upload/         # S3 / ImageKit integration
│           └── mail/                 # Email service
│
└── frontend/                         # React 19 + Vite + Tailwind CSS 4
    └── src/
        ├── features/                 # Feature-sliced modules
        │   ├── accounting/
        │   ├── billing/
        │   ├── hrm/
        │   ├── inventory/
        │   ├── pos/
        │   ├── purchase/
        │   ├── reports/
        │   ├── sales/
        │   ├── settings/
        │   ├── sms-marketing/
        │   ├── subscription/
        │   ├── super-admin/
        │   └── users/
        ├── redux/
        │   ├── api/                  # RTK Query endpoints
        │   └── features/             # Redux slices
        ├── components/               # Shared UI components
        ├── layouts/                  # Dashboard, Auth layouts
        ├── hooks/                    # Custom React hooks
        ├── helpers/                  # Axios instance, base query
        └── routes/                   # React Router config
```

---

## Database Design Highlights

```sql
-- Every tenant table follows this pattern
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,           -- tenant isolation
  name        VARCHAR NOT NULL,
  sku         VARCHAR UNIQUE,
  ...
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Append-only stock ledger (immutable audit trail)
CREATE TABLE stock_ledger (
  id               UUID PRIMARY KEY,
  business_id      UUID NOT NULL,
  product_id       UUID NOT NULL,
  warehouse_id     UUID NOT NULL,
  transaction_type VARCHAR NOT NULL,   -- PURCHASE, SALE, ADJUSTMENT, TRANSFER
  reference_type   VARCHAR NOT NULL,
  reference_id     UUID NOT NULL,
  qty_in           DECIMAL(15,4) DEFAULT 0,
  qty_out          DECIMAL(15,4) DEFAULT 0,
  balance_after    DECIMAL(15,4) NOT NULL,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- Double-entry accounting ledger
CREATE TABLE account_ledgers (
  id               UUID PRIMARY KEY,
  business_id      UUID NOT NULL,
  account_id       UUID NOT NULL,
  transaction_date DATE NOT NULL,
  debit            DECIMAL(15,2) DEFAULT 0,
  credit           DECIMAL(15,2) DEFAULT 0,
  balance_after    DECIMAL(15,2) NOT NULL,
  reference_type   VARCHAR,
  reference_id     UUID,
  note             TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);
```

### Naming Conventions
- All table names: `snake_case` plural
- UUID primary keys everywhere
- `business_id` on every tenant table
- Soft delete via `isActive` flag
- `created_at`, `updated_at` on every table

---

## API Highlights

All endpoints follow a consistent response envelope:

```json
{
  "success": true,
  "data": { },
  "statusCode": 200,
  "timestamp": "2026-06-29T00:00:00.000Z",
  "path": "/api/v1/..."
}
```

### Authentication Flow (Mobile OTP)
```
POST /api/v1/auth/mobile/send-otp      { mobile }
POST /api/v1/auth/mobile/verify-otp    { mobile, code }
  → isNewUser: false  →  { accessToken, refreshToken, user }   (existing user login)
  → isNewUser: true   →  { tempToken }                         (new user registration)
POST /api/v1/auth/mobile/register      { tempToken, name, password }
  → { accessToken, refreshToken, user }
POST /api/v1/auth/refresh              { refreshToken }
  → { accessToken, refreshToken }
```

### Key Business Rules Enforced in API
- Stock cannot go negative (checked inside transaction before commit)
- Double-entry validation: `sum(debit) === sum(credit)` before every ledger commit
- Subscription limits checked on every product/user create
- Suspended accounts blocked at guard level — data preserved
- All multi-table operations wrapped in `QueryRunner` transactions with full rollback

Swagger UI: `http://localhost:3001/api/docs`

---

## Registration → First Login Flow

```
1. POST /auth/mobile/send-otp       → OTP sent (dev: 123456)
2. POST /auth/mobile/verify-otp     → isNewUser: true → tempToken
3. POST /auth/mobile/register       → User + Business + Petty Cash account created
                                      in one atomic transaction
                                    → accessToken + refreshToken returned
4. User lands on /select-plan       → Choose Starter / Pro or continue trial
5. All subsequent logins:
   POST /auth/mobile/verify-otp     → isNewUser: false → tokens returned directly
```

---

## Transaction Safety

Every operation touching multiple tables uses a `QueryRunner` with explicit `startTransaction` / `commitTransaction` / `rollbackTransaction`:

```typescript
// Example: Sale creation (simplified)
const qr = this.dataSource.createQueryRunner();
await qr.connect();
await qr.startTransaction();
try {
  const sale     = await qr.manager.save(SaleEntity, saleData);
  const items    = await qr.manager.save(SaleItemEntity, itemsData);
  // Stock ledger (append-only)
  await qr.manager.save(StockLedgerEntity, ledgerEntry);
  // Update available stock
  await qr.manager.update(ProductStockEntity, { id }, { availableQty: newQty });
  // Customer ledger
  await qr.manager.save(CustomerLedgerEntity, customerEntry);
  // Double-entry accounting
  await qr.manager.save(AccountLedgerEntity, [debitRow, creditRow]);

  await qr.commitTransaction();
} catch (err) {
  await qr.rollbackTransaction(); // everything rolls back atomically
  throw err;
} finally {
  await qr.release();
}
```

---

## Redis Caching

| Key Pattern | TTL | Purpose |
|---|---|---|
| `business:{id}:subscription` | 5 min | Subscription validation (hot path) |
| `business:{id}:default_warehouse` | 1 hour | Warehouse lookup |
| `product:{id}:stock:{warehouse_id}` | 30 sec | POS live stock check |
| `otp:{mobile}` | 10 min | OTP verification |
| `report:{business_id}:{type}:{date}` | 10 min | Heavy report cache |
| `rate_limit:{ip}` | 1 min | OTP rate limiting |

---

## Installation & Running

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7
- Docker & Docker Compose (optional)

### Quick Start (Docker)

```bash
git clone https://github.com/your-username/solvexbd-erp.git
cd solvexbd-erp

cp backend/.env.example backend/.env
# Fill in DATABASE_URL, REDIS_HOST, JWT secrets, etc.

docker-compose up -d

# API:      http://localhost:3001
# Frontend: http://localhost:3000
# Swagger:  http://localhost:3001/api/docs
```

### Local Development

```bash
# Backend
cd backend
npm install
npm run start:dev        # http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

### Seed Super Admin

```bash
cd backend
npm run seed:super-admin
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/solvexbd_erp

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_TOKEN_TTL=3600        # seconds
JWT_REFRESH_TOKEN_TTL=604800     # 7 days
JWT_ISSUER=solvexbd-erp
JWT_AUDIENCE=localhost:5000
SUPER_ADMIN_JWT_SECRET=separate_super_admin_secret

# App
APP_PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Storage (choose one)
AWS_BUCKET=solvexbd-uploads
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Subscription
TRIAL_DAYS=15
```

---

## Deployment Checklist

- [ ] `NODE_ENV=production` in all `.env` files
- [ ] Separate JWT secrets for production
- [ ] SSL certificate configured in Nginx
- [ ] PostgreSQL connection pooling enabled
- [ ] Redis password set
- [ ] S3 / ImageKit credentials configured
- [ ] Swagger disabled or password-protected
- [ ] Rate limiting active on `/auth/mobile/send-otp`
- [ ] PM2 startup script registered (`pm2 startup && pm2 save`)
- [ ] Daily database backup cron active
- [ ] Health check endpoint `/health` returning 200

---

## Roadmap

### Completed
- [x] Mobile OTP authentication (send, verify, register, refresh)
- [x] Multi-tenant business isolation
- [x] Subscription system (trial, starter, pro) with enforcement
- [x] Super Admin panel (suspend, renew, reset, audit log)
- [x] Inventory — Products, Variants, Categories, Brands, Units, Warranties
- [x] Warehouse & Stock Ledger (append-only)
- [x] Stock Adjustments & Transfers
- [x] Supplier management with ledger
- [x] Purchase invoices with stock IN and accounting
- [x] Purchase returns
- [x] Customer management with ledger and aging
- [x] Sales invoices with profit tracking
- [x] Sale returns
- [x] Quotations with conversion to sale
- [x] POS (fast billing, barcode, hold/resume, multi-payment)
- [x] Double-entry accounting engine
- [x] Cash / Bank / Mobile Banking accounts
- [x] Petty Cash auto-created on registration
- [x] HRM — Employees, Departments, Designations
- [x] Attendance, Leave management
- [x] Payroll with loan deduction
- [x] KPI evaluation
- [x] Financial reports (P&L, Balance Sheet, Cash Flow)
- [x] Affiliate / referral system
- [x] Manual payment flow (bKash, Rocket, Nagad)
- [x] SMS marketing module
- [x] Image upload (S3 + ImageKit)
- [x] Excel export (SheetJS)
- [x] A4 invoice print + 58mm thermal POS receipt
- [x] Bilingual UI (English / Bengali)

### Upcoming
- [ ] Offline POS (PWA + IndexedDB sync)
- [ ] Mobile app (React Native)
- [ ] Bank reconciliation
- [ ] Advanced BI dashboard (Recharts)
- [ ] Webhook & third-party integrations
- [ ] Multi-warehouse transfer with approval workflow

---

## Author

**Md. Shamim Hossain**
Full-Stack Developer — NestJS · React · PostgreSQL · TypeScript

- GitHub: [github.com/shamimhossain515419](https://github.com/shamimhossain515419)
- Email: elias.irozen@gmail.com

---

<p align="center">
  Built with dedication for Bangladeshi businesses.<br/>
  <em>প্রতিটি পয়সার হিসাব সঠিক।</em> — Every paisa accounted for.
</p>
