# 🏢 BizCore ERP — Multi-tenant SaaS Business Management System

> **Fintech-grade** Inventory · POS · HRM · Accounting platform built for 5,000+ concurrent shops.  
> Zero calculation errors. Every paisa accounted for.

---

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Module Overview](#module-overview)
5. [Database Design](#database-design)
6. [Backend — NestJS Setup](#backend--nestjs-setup)
7. [Frontend — React.js Setup](#frontend--nextjs-setup)
8. [Authentication & Multi-tenancy](#authentication--multi-tenancy)
9. [Subscription & Package System](#subscription--package-system)
10. [API Documentation (Swagger)](#api-documentation-swagger)
11. [Redis Caching Strategy](#redis-caching-strategy)
12. [Transaction & Rollback Strategy](#transaction--rollback-strategy)
13. [Reusable Frontend Components](#reusable-frontend-components)
14. [Bilingual Support (EN / BN)](#bilingual-support-en--bn)
15. [Super Admin Panel](#super-admin-panel)
16. [Environment Variables](#environment-variables)
17. [Project Structure](#project-structure)
18. [Installation & Running](#installation--running)
19. [MCV Server / Persistent Session Guide](#mcv-server--persistent-session-guide)
20. [Deployment Checklist](#deployment-checklist)
21. [Roadmap](#roadmap)

---

## Project Overview

BizCore is a **Multi-tenant SaaS ERP** where each registered business gets an isolated workspace. The system currently covers four core pillars:

| Pillar         | What it does                                                                            |
| -------------- | --------------------------------------------------------------------------------------- |
| **Inventory**  | Products, Categories, Units, Brands, Warranties, Stock Ledger, Adjustments, Transfers   |
| **POS**        | Fast billing, barcode scan, hold/resume sale, multiple payment splits, coupon/gift-card |
| **HRM**        | Employees, Attendance, Leave, Payroll, Loans, Advance, KPI, Exit                        |
| **Accounting** | Double-entry ledger, Cash/Bank/Mobile-banking accounts, P&L, Balance Sheet, Cash Flow   |

### Key Constraints

- **Mobile-number-first** — OTP login, no email required
- **Single store per business** (warehouse-level granularity instead of branches)
- **Subscription-gated** — 2 plans + 15-day free trial; limits enforced on users & products
- **Fintech precision** — all monetary values stored as `DECIMAL(15,2)`, all stock as `DECIMAL(15,4)`, double-entry enforced everywhere
- **5,000+ concurrent shops** — designed for horizontal scale from day one

---

## Tech Stack

### Backend

| Layer         | Technology                                            |
| ------------- | ----------------------------------------------------- |
| Runtime       | Node.js 20 LTS                                        |
| Framework     | NestJS 10                                             |
| ORM           | Prisma 5                                              |
| Database      | PostgreSQL 16                                         |
| Cache / Queue | Redis 7 (ioredis)                                     |
| Auth          | JWT (access + refresh) · OTP via SMS gateway          |
| Validation    | class-validator · class-transformer · DTOs            |
| API Docs      | Swagger / OpenAPI 3                                   |
| Job Queue     | BullMQ (payroll, reports, notifications)              |
| File Storage  | AWS S3 / MinIO (product images, payslips)             |
| SMS           | Twilio / Bangladesh local gateway (e.g. SSL Wireless) |

### Frontend

| Layer     | Technology                 |
| --------- | -------------------------- |
| Framework | React.js 18 (App Router)   |
| State     | Redux toolkit + Axios      |
| UI        | Tailwind CSS + custom css  |
| Forms     | React Hook Form + Zod      |
| i18n      | next-intl (EN / BN toggle) |
| Charts    | Recharts                   |
| Barcode   | @zxing/browser             |

### Infrastructure

| Component     | Choice                                          |
| ------------- | ----------------------------------------------- |
| Container     | Docker + Docker Compose                         |
| Reverse Proxy | Nginx                                           |
| CI/CD         | GitHub Actions                                  |
| Monitoring    | PM2 (dev/staging) · Prometheus + Grafana (prod) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTS                            │
│   Browser (Next.js)      Mobile PWA      POS Terminal   │
└────────────────┬────────────────────────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────────────────────────┐
│               Nginx Reverse Proxy                        │
└──────┬──────────────────────────┬───────────────────────┘
       │                          │
┌──────▼──────┐           ┌───────▼──────┐
│  NestJS API │           │  Static CDN  │
│  Port 3001  │           │  (Next.js)   │
└──────┬──────┘           └──────────────┘
       │
┌──────┼────────────────────────┐
│      │                        │
▼      ▼                        ▼
PostgreSQL   Redis 7         BullMQ Workers
(Primary DB) (Cache/Session)  (Async Jobs)
```

### Multi-tenancy Model

Every table with business data carries a `business_id` (UUID). A **Row-Level Guard** (NestJS Guard + Prisma middleware) injects `business_id` from the JWT on every query — tenants are physically isolated at the row level within a shared schema.

---

## Module Overview

### Phase 1 — Foundation

```
Auth          → Registration · OTP · JWT · Refresh Token
Business      → Business setup · Shop creation · Default warehouse
Subscription  → Package selection · Trial · Limit enforcement
SuperAdmin    → Platform-wide control panel
```

### Phase 2 — Product Foundation

```
Category      → CRUD · Tree structure
Unit          → CRUD
Brand         → CRUD
Warranty      → CRUD
Product       → Single + Variant · SKU · Barcode · Opening stock
```

### Phase 3 — Inventory

```
Warehouse     → CRUD · Default warehouse logic
Stock Ledger  → Immutable ledger (append-only)
Stock Adjust  → Plus / Minus adjustments
Stock Transfer→ Shop↔Warehouse · Warehouse↔Warehouse
```

### Phase 4 — Purchase

```
Supplier      → CRUD · Ledger · Balance
Purchase      → Invoice · Items · Stock IN · Accounting
Purchase Return → Stock OUT · Supplier credit
```

### Phase 5 — Sales / POS

```
Customer      → CRUD · Ledger · Balance · Aging
Sale          → Invoice · Items · Multi-payment · Due
POS           → Fast bill · Barcode · Hold/Resume · Coupon
Sale Return   → Stock back · Refund
Quotation     → Create · Convert to Sale
```

### Phase 6 — Accounting

```
Accounts      → Cash · Bank · Mobile Banking
Transactions  → Expense · Income
Account Ledger→ Double-entry engine
Reports       → P&L · Balance Sheet · Trial Balance · Cash Flow · Statement
```

### Phase 7 — HRM

```
Employees     → Full profile · Documents
Attendance    → Manual · QR · Device integration
Leave         → Types · Request · Approval workflow
Payroll       → Structure · Generate · Approve · Payslip
Loan/Advance  → Installment tracking · Payroll deduction
KPI           → Evaluation criteria · Rating
Exit          → Resignation · Clearance · Final settlement
```

---

## Database Design

### Naming Conventions

- All table names: `snake_case` plural
- UUID primary keys everywhere
- `business_id` on every tenant table
- Soft delete via `deleted_at TIMESTAMP NULL`
- `created_at`, `updated_at` on every table

### Core Tables (abbreviated)

## প্রথমে করো:

1. আমার পুরো project structure দেখো
2. Existing code, components, styles বোঝো
3. Tech stack কী আছে সেটা বোঝো

## তারপর এই কাজগুলো করো:

### 🎨 UI - 100% Mobile Responsive + Best Looking

- সব page mobile first design করো
- Breakpoints: 320px, 480px, 768px, 1024px, 1280px সব perfect হতে হবে
- Modern, clean, professional UI বানাও
- Sidebar mobile-এ drawer হবে, desktop-এ fixed থাকবে
- Tables mobile-এ card view হবে
- Forms mobile-এ full width হবে
- Touch friendly buttons (minimum 44px height)
- Smooth animations ও transitions দাও
- Color scheme consistent রাখো সব জায়গায়
- Loading states ও empty states বানাও

### 🖨️ Invoice Print - দুইটা format:

**Format 1 - A4 / Standard Invoice:**

- Company logo ও info উপরে
- Invoice number, date, due date
- Customer details box
- Items table (product, qty, rate, amount)
- Subtotal, discount, tax, grand total
- Payment terms ও notes section
- Footer with thank you message
- Print করলে শুধু invoice দেখাবে, বাকি UI hide হবে
- @media print CSS perfect করো

**Format 2 - POS Thermal Receipt (58mm width):**

- 58mm = 220px width
- Company name centered, bold
- Date ও time
- Divider lines (-----)
- Items: name left, price right
- Quantity ও unit price নিচে
- Total amount বড় করে
- Payment method
- Thank you message
- QR code optional
- Font: monospace, 12px
- No colors in print (grayscale)

### 📱 Print Button Logic:

- "Print A4 Invoice" button → A4 format open হবে new window-এ
- "Print POS (58mm)" button → thermal format open হবে
- Print preview দেখাবে
- Browser print dialog automatically আসবে

```sql
-- Tenant root
businesses (id, name, mobile, business_type, status, subscription_id, ...)

-- Auth
users (id, business_id, mobile, password_hash, role, ...)
otp_logs (id, mobile, otp_hash, expires_at, used_at, ...)

-- Subscription
subscription_plans (id, name, max_users, max_products, price_monthly, ...)
business_subscriptions (id, business_id, plan_id, starts_at, expires_at, status, ...)

-- Inventory core
products (id, business_id, name, sku, category_id, unit_id, brand_id, ...)
product_variants (id, product_id, name, sku, ...)
product_stocks (id, business_id, warehouse_id, product_id, opening_qty,
                in_qty, out_qty, current_qty, reserved_qty, available_qty,
                avg_cost, last_updated, ...)
stock_ledger (id, business_id, product_id, warehouse_id, transaction_type,
              reference_type, reference_id, qty_in, qty_out, balance_after,
              note, created_by, created_at)

-- Purchase
purchases (id, business_id, supplier_id, warehouse_id, invoice_no, date,
           subtotal, discount, tax, total, paid, due, status, ...)
purchase_items (id, purchase_id, product_id, qty, unit_cost, total, ...)

-- Sales
sales (id, business_id, customer_id, warehouse_id, invoice_no, date,
       subtotal, discount, tax, total, paid, due, profit, status, ...)
sale_items (id, sale_id, product_id, qty, unit_price, cost_price,
            discount, tax, total, profit, ...)

-- Accounting (Double Entry)
accounts (id, business_id, name, account_type, opening_balance,
          current_balance, is_default, ...)
account_ledgers (id, business_id, account_id, transaction_date,
                 transaction_type, reference_type, reference_id,
                 debit, credit, balance_after, note, created_by, ...)

-- Customer / Supplier Ledger
customer_ledger (id, business_id, customer_id, transaction_date,
                 transaction_type, debit, credit, balance_after, ...)
customer_balances (customer_id PK, business_id, current_balance, balance_type, ...)

supplier_ledger (id, business_id, supplier_id, transaction_date,
                 transaction_type, debit, credit, balance_after, ...)
supplier_balances (supplier_id PK, business_id, current_balance, balance_type, ...)

-- HRM
employees (id, business_id, employee_code, name, mobile, department_id,
           designation_id, joining_date, employment_type, status, ...)
payrolls (id, business_id, employee_id, month, year, gross_salary,
          total_deduction, net_salary, status, ...)
attendances (id, business_id, employee_id, date, check_in, check_out, status, ...)
```

> Full Prisma schema is in `backend/prisma/schema.prisma`

---

## Backend — NestJS Setup

### Module Structure

```
src/
├── common/
│   ├── decorators/        # @CurrentUser, @BusinessId, @Roles
│   ├── filters/           # Global exception filter
│   ├── guards/            # JwtAuthGuard, RolesGuard, TenantGuard, SubscriptionGuard
│   ├── interceptors/      # ResponseInterceptor, LoggingInterceptor
│   ├── middleware/        # TenantMiddleware
│   └── pipes/             # ValidationPipe config
│
├── modules/
│   ├── auth/              # OTP, JWT, refresh token
│   ├── business/          # Business + shop setup
│   ├── subscription/      # Plans, trial, validation
│   ├── super-admin/       # Platform admin
│   ├── warehouse/
│   ├── category/
│   ├── unit/
│   ├── brand/
│   ├── warranty/
│   ├── product/
│   ├── stock/             # Ledger, adjustment, transfer
│   ├── supplier/
│   ├── purchase/
│   ├── purchase-return/
│   ├── customer/
│   ├── sale/
│   ├── pos/
│   ├── sale-return/
│   ├── quotation/
│   ├── account/           # Accounts + ledger
│   ├── expense/
│   ├── income/
│   ├── report/
│   ├── employee/
│   ├── attendance/
│   ├── leave/
│   ├── payroll/
│   ├── loan/
│   └── hrm-report/
│
├── prisma/                # PrismaService
├── redis/                 # RedisService
└── main.ts
```

### DTO Pattern (example)

```typescript
// create-product.dto.ts
import { IsString, IsUUID, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsUUID()
  category_id: string;

  @ApiProperty()
  @IsUUID()
  unit_id: string;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchase_price: number;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  selling_price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  opening_stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  has_serial?: boolean;
}
```

### Global Validation Pipe

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

---

## Frontend — Next.js Setup

### Directory Structure

```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── layout.tsx          # Sidebar + Header
│   ├── dashboard/
│   ├── inventory/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── stock-adjustment/
│   │   └── stock-transfer/
│   ├── purchase/
│   ├── sales/
│   ├── pos/
│   ├── customers/
│   ├── suppliers/
│   ├── accounting/
│   ├── hrm/
│   └── reports/
├── super-admin/
│   └── ...
└── layout.tsx

components/
├── ui/                     # shadcn base components
├── shared/
│   ├── SearchSelect.tsx     # ← Reusable infinite-scroll select
│   ├── DataTable.tsx        # ← Server-side paginated table
│   ├── Modal.tsx            # ← Simple action modal wrapper
│   ├── ConfirmDialog.tsx
│   ├── PageHeader.tsx
│   ├── StatusBadge.tsx
│   ├── CurrencyDisplay.tsx
│   └── LoadingSpinner.tsx
└── modules/                # Module-specific components
```

---

## Authentication & Multi-tenancy

### Registration Flow

```
POST /auth/send-otp      { mobile }
POST /auth/verify-otp    { mobile, otp }          → temp_token
POST /auth/register      { temp_token, password }  → creates user + business stub
POST /business/setup     { name, type, shop_name } → completes onboarding
POST /subscription/select { plan_id }              → activates plan / trial
```

### Login Flow

```
POST /auth/send-otp   { mobile }
POST /auth/login-otp  { mobile, otp } → { access_token, refresh_token }
POST /auth/refresh    { refresh_token } → new access_token
```

### JWT Payload

```json
{
  "sub": "user-uuid",
  "business_id": "business-uuid",
  "role": "ADMIN | EMPLOYEE | SUPER_ADMIN",
  "iat": 1700000000,
  "exp": 1700003600
}
```

### Tenant Guard (Prisma Middleware)

```typescript
// prisma.middleware.ts
prisma.$use(async (params, next) => {
  const tenantModels = ['Product', 'Sale', 'Purchase', ...];
  if (tenantModels.includes(params.model) && params.args.where) {
    params.args.where.business_id = currentBusinessId; // injected from context
  }
  return next(params);
});
```

---

## Subscription & Package System

### Plans

| Feature      | **Starter**  | **Pro**     |
| ------------ | ------------ | ----------- |
| Price        | ৳500/month   | ৳1200/month |
| Max Users    | 3            | 25          |
| Max Products | 500          | Unlimited   |
| Warehouses   | 1            | 5           |
| Reports      | Basic        | Full        |
| Trial        | 15 days free | —           |

### Enforcement

```typescript
// subscription.guard.ts
@Injectable()
export class SubscriptionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { business_id } = request.user;
    const sub = await this.subscriptionService.getActive(business_id);

    if (sub.expires_at < new Date()) throw new ForbiddenException('Subscription expired');

    if (context.getHandler().name === 'createProduct') {
      const count = await this.productService.count(business_id);
      if (sub.plan.max_products !== -1 && count >= sub.plan.max_products)
        throw new ForbiddenException('Product limit reached');
    }
    return true;
  }
}
```

---

## API Documentation (Swagger)

Swagger UI is available at: `http://localhost:3001/api/docs`

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('BizCore ERP API')
  .setDescription('Multi-tenant SaaS ERP — Inventory · POS · HRM · Accounting')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('Auth')
  .addTag('Business')
  .addTag('Subscription')
  .addTag('Products')
  .addTag('Stock')
  .addTag('Purchase')
  .addTag('Sales')
  .addTag('POS')
  .addTag('Accounting')
  .addTag('HRM')
  .addTag('Reports')
  .addTag('SuperAdmin')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

Every controller method is decorated with `@ApiOperation`, `@ApiResponse`, and `@ApiBearerAuth`.

---

## Redis Caching Strategy

| Key Pattern                                 | TTL    | Purpose                            |
| ------------------------------------------- | ------ | ---------------------------------- |
| `business:{id}:subscription`                | 5 min  | Subscription validation (hot path) |
| `business:{id}:default_warehouse`           | 1 hour | Warehouse lookup                   |
| `product:{id}:stock:{warehouse_id}`         | 30 sec | POS live stock check               |
| `otp:{mobile}`                              | 5 min  | OTP verification                   |
| `report:{business_id}:{report_type}:{date}` | 10 min | Heavy report cache                 |
| `rate_limit:{ip}`                           | 1 min  | OTP rate limiting                  |

```typescript
// redis.service.ts
async get<T>(key: string): Promise<T | null> {
  const data = await this.redis.get(key);
  return data ? JSON.parse(data) : null;
}

async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

async del(key: string): Promise<void> {
  await this.redis.del(key);
}
```

---

## Transaction & Rollback Strategy

Every operation that touches **multiple tables** runs inside a Prisma interactive transaction. This guarantees atomicity — either everything commits or everything rolls back.

### Example: Create Sale

```typescript
async createSale(dto: CreateSaleDto, businessId: string) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Create sale header
    const sale = await tx.sale.create({ data: { ...dto, business_id: businessId } });

    // 2. Create sale items + calculate profit
    for (const item of dto.items) {
      const stock = await tx.productStock.findFirst({
        where: { product_id: item.product_id, warehouse_id: dto.warehouse_id },
      });
      if (!stock || stock.available_qty < item.qty)
        throw new BadRequestException(`Insufficient stock for product ${item.product_id}`);

      await tx.saleItem.create({ data: { sale_id: sale.id, ...item } });

      // 3. Stock ledger (append-only)
      await tx.stockLedger.create({
        data: {
          business_id: businessId,
          product_id: item.product_id,
          warehouse_id: dto.warehouse_id,
          transaction_type: 'SALE',
          reference_type: 'sale',
          reference_id: sale.id,
          qty_in: 0,
          qty_out: item.qty,
          balance_after: stock.current_qty - item.qty,
        },
      });

      // 4. Update product stock
      await tx.productStock.update({
        where: { id: stock.id },
        data: {
          out_qty: { increment: item.qty },
          current_qty: { decrement: item.qty },
          available_qty: { decrement: item.qty },
        },
      });
    }

    // 5. Customer ledger
    if (dto.customer_id) {
      await this.customerLedgerService.recordSale(tx, dto.customer_id, sale);
    }

    // 6. Account ledger (double entry)
    await this.accountLedgerService.recordSale(tx, businessId, sale, dto.payments);

    return sale;
  });
}
```

### Double-Entry Enforcement

Every financial event creates **two ledger rows** (debit side + credit side) via `accountLedgerService.doubleEntry()`. The service validates that `sum(debit) === sum(credit)` before committing.

---

## Reusable Frontend Components

### `<SearchSelect />` — Infinite Scroll Searchable Dropdown

```tsx
// components/shared/SearchSelect.tsx
interface SearchSelectProps<T> {
  endpoint: string; // e.g. '/products'
  valueKey: keyof T;
  labelKey: keyof T;
  placeholder?: string;
  onChange: (value: T) => void;
  value?: T | null;
  createLabel?: string; // "Create new product"
  onCreateClick?: () => void;
}
```

**Behavior:**

- Debounced search (300ms) — calls `endpoint?search=<query>&limit=20&page=N`
- Scroll-to-load-more — when user reaches bottom, fetches next page
- **"+ Create More"** button at bottom opens creation modal
- Keyboard accessible (↑↓ Enter Escape)

### `<DataTable />` — Server-side Paginated Table

- Column definitions with sort, filter
- Bulk select + bulk actions
- Export to CSV / PDF
- Responsive (horizontal scroll on mobile)

### `<Modal />` — Simple Action Modal

```tsx
<Modal title="Add Category" trigger={<Button>+ Add</Button>} onSubmit={handleSubmit}>
  <CategoryForm />
</Modal>
```

Simple CRUD operations (Add Category, Add Unit, Add Brand, Add Warehouse) open in a modal — no page navigation needed.

---

## Bilingual Support (EN / BN)

Toggle button in the top navigation bar switches the entire UI between English and Bangla instantly.

```
messages/
├── en.json
└── bn.json
```

```json
// en.json (sample)
{
  "nav.dashboard": "Dashboard",
  "nav.inventory": "Inventory",
  "product.name": "Product Name",
  "sale.invoice": "Invoice"
}

// bn.json (sample)
{
  "nav.dashboard": "ড্যাশবোর্ড",
  "nav.inventory": "ইনভেন্টরি",
  "product.name": "পণ্যের নাম",
  "sale.invoice": "ইনভয়েস"
}
```

```tsx
// Usage in component
const t = useTranslations();
<h1>{t('nav.dashboard')}</h1>;
```

3. Subscription: Renew / Upgrade / Suspend
   PATCH /super-admin/businesses/:id/subscription
   Actions the Super Admin can take:
   ✅ Renew Subscription
   Extend the current plan by N months from today (or from expiry date).
   json{
   "action": "renew",
   "extend_months": 1,
   "note": "Manual renewal by admin"
   }
   🔄 Change Plan
   Move the business to a different plan immediately.
   json{
   "action": "change_plan",
   "plan_id": "uuid-of-new-plan",
   "note": "Upgraded to Pro on request"
   }
   ⏸ Suspend Account
   Immediately blocks all API access for the business. Users see a "Account suspended" message. Data is kept intact.
   json{
   "action": "suspend",
   "reason": "Payment overdue",
   "note": "Suspended after 3 reminders"
   }
   ▶️ Unsuspend Account
   Re-activates a suspended account.
   json{
   "action": "unsuspend",
   "note": "Payment received"
   }
   🎁 Extend Trial
   Add extra days to the trial period.
   json{
   "action": "extend_trial",
   "extra_days": 7,
   "note": "Extended trial on request"
   }
   business_subscriptions table:
   sqlbusiness_subscriptions (
   id UUID PRIMARY KEY,
   business_id UUID NOT NULL,
   plan_id UUID NOT NULL,
   status ENUM('trial', 'active', 'expired', 'suspended'),
   starts_at TIMESTAMP NOT NULL,
   expires_at TIMESTAMP NOT NULL,
   trial_ends_at TIMESTAMP,
   suspended_at TIMESTAMP,
   suspend_reason TEXT,
   renewed_by UUID, -- super admin user id
   note TEXT,
   created_at TIMESTAMP,
   updated_at TIMESTAMP
   )
   All subscription changes are logged in a subscription_audit_log table:
   sqlsubscription_audit_log (
   id UUID PRIMARY KEY,
   business_id UUID NOT NULL,
   action VARCHAR(50), -- renew, suspend, change_plan, extend_trial…
   old_value JSONB,
   new_value JSONB,
   performed_by UUID, -- super admin id
   note TEXT,
   created_at TIMESTAMP
   )

4. Company Data Reset

⚠️ Destructive operation — requires double confirmation

Super Admin can wipe all operational data for a business while keeping the account, users, and settings intact. Useful for:

Business wants to start fresh after a test period
Demo accounts cleanup
Data corruption recovery

POST /super-admin/businesses/:id/reset
Request body (requires explicit confirmation):
json{
"confirm_text": "RESET CONFIRM",
"reset_scope": "all_data",
"note": "Business requested full reset before going live"
}
Reset Scopes:
ScopeWhat gets deletedall_dataEverything below (full wipe)transactions_onlySales, Purchases, Payments, Ledgersinventory_onlyProducts, Stock, Stock Ledgerhrm_onlyAttendance, Payroll, Leave recordsaccounting_onlyAccount Ledgers, Transactions
What is NEVER deleted during reset:

Business profile & settings
User accounts & roles
Subscription record
Categories, Units, Brands (master data) — optional keep
Warehouses
Subscription audit log

Reset Flow (backend):
typescriptasync resetBusinessData(businessId: string, scope: ResetScope, adminId: string) {
return this.prisma.$transaction(async (tx) => {
// Log the reset action first
await tx.subscriptionAuditLog.create({
data: { business_id: businessId, action: 'DATA_RESET', performed_by: adminId, ... }
});

    if (scope === 'all_data' || scope === 'transactions_only') {
      await tx.saleItem.deleteMany({ where: { sale: { business_id: businessId } } });
      await tx.sale.deleteMany({ where: { business_id: businessId } });
      await tx.purchaseItem.deleteMany({ where: { purchase: { business_id: businessId } } });
      await tx.purchase.deleteMany({ where: { business_id: businessId } });
      await tx.accountLedger.deleteMany({ where: { business_id: businessId } });
      await tx.customerLedger.deleteMany({ where: { business_id: businessId } });
      await tx.supplierLedger.deleteMany({ where: { business_id: businessId } });
      await tx.customerBalance.deleteMany({ where: { business_id: businessId } });
      await tx.supplierBalance.deleteMany({ where: { business_id: businessId } });
      // Reset account balances to opening balance
      await tx.account.updateMany({
        where: { business_id: businessId },
        data: { current_balance: tx.account.fields.opening_balance },
      });
    }

    if (scope === 'all_data' || scope === 'inventory_only') {
      await tx.stockLedger.deleteMany({ where: { business_id: businessId } });
      await tx.productStock.deleteMany({ where: { business_id: businessId } });
    }

    // Invalidate all Redis cache for this business
    await this.redisService.delPattern(`business:${businessId}:*`);

});
}

5. Super Admin Dashboard Summary
   GET /super-admin/dashboard
   Returns platform-wide stats:
   json{
   "total_businesses": 312,
   "active_subscriptions": 278,
   "trial_accounts": 24,
   "expired_accounts": 8,
   "suspended_accounts": 2,
   "revenue_this_month": 156000.00,
   "new_signups_this_month": 34,
   "plan_breakdown": {
   "starter": 190,
   "pro": 88,
   "trial": 24
   },
   "system_health": {
   "db_connections": 42,
   "redis_memory_mb": 128,
   "queue_pending_jobs": 3
   }
   }

6. Super Admin Role Security

Super Admin has a completely separate login endpoint: POST /super-admin/auth/login
Uses its own SUPER_ADMIN_JWT_SECRET (not the same as tenant JWT secret)
Super Admin JWT payload contains role: "SUPER_ADMIN" — verified by a dedicated SuperAdminGuard
Super Admin accounts are seeded via npm run seed:super-admin — cannot be created through the public API
All Super Admin actions are written to super_admin_action_logs table for full audit trail

---

## Super Admin Panel

Accessible at `/super-admin` — completely separate from tenant dashboards.

| Feature              | Description                                |
| -------------------- | ------------------------------------------ |
| Business List        | View all registered businesses with status |
| Subscription Control | Extend trial, change plan, suspend account |
| Usage Stats          | Users, products, sales per business        |
| System Health        | DB connections, Redis memory, queue depth  |
| Announcements        | Push notifications to all/selected tenants |
| Package Management   | Edit plan limits and pricing               |

Super Admin login uses a separate JWT secret and role that can never be spoofed by a tenant JWT.

---

## Environment Variables

```env
# ─── Database ───────────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/bizcore

# ─── Redis ──────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ─── JWT ────────────────────────────────────────────
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d
SUPER_ADMIN_JWT_SECRET=separate_super_admin_secret

# ─── OTP / SMS ──────────────────────────────────────
SMS_PROVIDER=ssl_wireless          # or twilio
SMS_API_KEY=
SMS_SENDER_ID=BizCore
OTP_EXPIRY_MINUTES=5

# ─── Storage ────────────────────────────────────────
STORAGE_PROVIDER=s3                # or minio
AWS_BUCKET=bizcore-uploads
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY=
AWS_SECRET_KEY=

# ─── App ────────────────────────────────────────────
APP_PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# ─── Subscription ───────────────────────────────────
TRIAL_DAYS=15
```

---

## Project Structure

```
bizcore/
├── backend/                        # NestJS API
│   ├── src/
│   │   ├── common/
│   │   ├── modules/
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── test/
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                       # Next.js 14
│   ├── app/
│   ├── components/
│   ├── messages/                   # i18n (en.json, bn.json)
│   ├── lib/
│   ├── store/                      # Zustand stores
│   ├── hooks/
│   ├── .env.local
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx/
│   └── nginx.conf
└── README.md
```

---

## Installation & Running

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/bizcore.git
cd bizcore

# 2. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Start all services
docker-compose up -d

# 4. Run database migrations
docker-compose exec backend npx prisma migrate deploy

# 5. Seed super admin + default plans
docker-compose exec backend npm run seed

# API:      http://localhost:3001
# Frontend: http://localhost:3000
# Swagger:  http://localhost:3001/api/docs
```

### Local Dev (without Docker)

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npx prisma generate
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## MCV Server / Persistent Session Guide

> This guide is for running BizCore on a local MCV server while you are away for up to 10 days.

### Setup PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd backend
pm2 start "npm run start:prod" --name bizcore-api

# Start frontend (built)
cd ../frontend
npm run build
pm2 start "npm run start" --name bizcore-frontend

# Save PM2 process list (auto-restart on server reboot)
pm2 save
pm2 startup   # follow the output command to enable on boot
```

### Session Resume Workflow

When you return after a session break:

```bash
# Check all services are running
pm2 status

# View live logs
pm2 logs bizcore-api --lines 100
pm2 logs bizcore-frontend --lines 50

# If any service crashed, restart it
pm2 restart bizcore-api

# Check database health
psql $DATABASE_URL -c "SELECT COUNT(*) FROM businesses;"

# Check Redis
redis-cli ping   # should return PONG
```

### Auto-continue Development

The project is structured so each module is independently runnable. To continue work on a specific module after a break:

1. Check `pm2 status` — services should be live
2. Open Swagger at `/api/docs` to verify API is healthy
3. Run `git status` to see last working state
4. Resume from the last incomplete module in the [Roadmap](#roadmap)

### Nightly Backup Cron (recommended)

```bash
# Add to crontab: crontab -e
0 2 * * * pg_dump $DATABASE_URL > /backups/bizcore_$(date +\%Y\%m\%d).sql
```

---

## Deployment Checklist

- [ ] `NODE_ENV=production` set in all `.env` files
- [ ] Separate JWT secrets for prod (not same as dev)
- [ ] SSL certificate configured in Nginx
- [ ] Database connection pooling enabled (PgBouncer or Prisma connection limit)
- [ ] Redis password set and not exposed
- [ ] S3 bucket CORS configured for frontend domain
- [ ] SMS gateway live credentials configured
- [ ] `prisma migrate deploy` run (not `migrate dev`)
- [ ] Swagger disabled or password-protected in production
- [ ] Rate limiting enabled on `/auth/send-otp` (max 5 req/min per mobile)
- [ ] PM2 startup script registered
- [ ] Daily DB backup cron active
- [ ] Health check endpoint `/health` returning 200

---

## Roadmap

### ✅ Phase 1 — Currently Building

- [x] Auth (OTP · JWT · Refresh)
- [x] Business & Shop Setup
- [x] Subscription System (Starter / Pro / 15-day trial)
- [x] Super Admin Panel
- [ ] Category · Unit · Brand · Warranty
- [ ] Product Module (Single + Variant)
- [ ] Warehouse & Stock Ledger
- [ ] Stock Adjustment & Transfer
- [ ] Supplier & Purchase
- [ ] Customer & Sales / POS
- [ ] Accounting (Double Entry)
- [ ] HRM (Employees · Attendance · Payroll)
- [ ] Reports Module

### 🔜 Phase 2 — Future

- [ ] Multi-language invoice PDF (EN/BN)
- [ ] Mobile app (React Native / PWA)
- [ ] Bank reconciliation
- [ ] Advanced analytics & BI dashboard
- [ ] Webhook & third-party API integrations
- [ ] Offline POS (PWA + IndexedDB sync)

---

## Contributing

1. Create a feature branch: `git checkout -b feature/module-name`
2. Follow the DTO + Service + Controller + Module pattern
3. Add Swagger decorators to every endpoint
4. Write Prisma transactions wherever multiple tables are touched
5. Update `messages/en.json` and `messages/bn.json` for any new UI text , just frontend
6. Submit PR with a clear description of the change

---

## License

Proprietary — All rights reserved © BizCore 2025

---

_Built with ❤️ for Bangladeshi businesses. প্রতিটি পয়সার হিসাব সঠিক।_
