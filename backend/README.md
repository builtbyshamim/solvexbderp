<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeORM-0.3-FE0902?style=for-the-badge" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI_3-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" />
</p>

<h1 align="center">SolvexBD ERP — Backend API</h1>
<p align="center">
  Multi-tenant SaaS ERP REST API built with NestJS 11 · PostgreSQL 16 · Redis 7<br/>
  <strong>Base URL:</strong> <code>http://localhost:5004/api/v1</code>
  &nbsp;|&nbsp;
  <strong>Swagger Docs:</strong> <code>http://localhost:5004/api/docs</code>
</p>

---

## Live Demo & Test Credentials

**Frontend:** [https://solvexbd-erp.vercel.app/](https://solvexbd-erp.vercel.app/)

### Super Admin

| Field | Value |
|---|---|
| Login URL | `/super-admin/login` |
| Email | `admin@gmail.com` |
| Password | `Admin1234@` |
| Mobile | `01000000000` |

> Super Admin uses a separate JWT secret (`SUPER_ADMIN_JWT_SECRET`) and role that cannot be claimed by any tenant token.

### Business User (OTP Login)

| Field | Value |
|---|---|
| Login URL | `/login` |
| Mobile | Any valid BD number |
| OTP | `123456` (fixed in development) |

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Module Reference](#module-reference)
5. [Architecture & Patterns](#architecture--patterns)
6. [Authentication](#authentication)
7. [Guards & Decorators](#guards--decorators)
8. [Interceptors & Filters](#interceptors--filters)
9. [Database Design](#database-design)
10. [Transaction Strategy](#transaction-strategy)
11. [Redis Caching](#redis-caching)
12. [API Response Format](#api-response-format)
13. [Environment Variables](#environment-variables)
14. [Installation & Running](#installation--running)

---

## Overview

The SolvexBD ERP backend is a production-ready **NestJS 11** REST API that powers a multi-tenant SaaS ERP platform. Each registered business receives a fully isolated workspace via row-level tenant isolation — `business_id` is extracted from the JWT and injected into every database query automatically.

### Core Principles

- **Atomic transactions** — all multi-table operations run inside `QueryRunner` with full rollback on any failure
- **Fintech-grade precision** — monetary values stored as `DECIMAL(15,2)`, stock quantities as `DECIMAL(15,4)`
- **Double-entry enforcement** — every financial event validates `sum(debit) === sum(credit)` before commit
- **Append-only audit trail** — stock ledger and account ledger entries are never mutated after creation
- **Layered security** — JWT guard → role guard → permission guard → subscription guard
- **URI versioning** — all routes served under `/api/v1/`
- **Consistent response envelope** — every endpoint returns the same `{ success, data, statusCode, timestamp, path }` shape

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5.7 |
| ORM | TypeORM 0.3 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 (ioredis) |
| Auth | JWT (access + refresh) · Passport.js · bcrypt |
| Validation | class-validator · class-transformer |
| API Documentation | Swagger / OpenAPI 3 (`@nestjs/swagger`) |
| Security | Helmet · CORS · rate limiting |
| File Storage | AWS S3 · ImageKit |
| Image Processing | Sharp |
| Email | Nodemailer |
| Excel Export | SheetJS (xlsx) |
| Slug Generation | slugify |
| Unique IDs | nanoid |
| Device Detection | ua-parser-js |

---

## Project Structure

```
backend/src/
│
├── main.ts                          # Bootstrap — Helmet, CORS, global pipes, versioning, Swagger
├── app.module.ts                    # Root module
│
├── config/                          # Configuration factories (loaded via ConfigModule)
│   ├── app.config.ts
│   ├── database.config.ts           # TypeORM async config
│   ├── jwt.config.ts
│   ├── mail.config.ts
│   └── swagger.config.ts
│
├── common/                          # Shared infrastructure (no business logic)
│   ├── decorators/
│   │   ├── current-user.decorator.ts    # @CurrentUser() → JwtPayload
│   │   ├── business-id.decorator.ts     # @BusinessId() → string
│   │   ├── roles.decorator.ts           # @Roles(UserRole.ADMIN)
│   │   ├── permission.decorator.ts      # @Permission('inventory.create')
│   │   ├── public.decorator.ts          # @Public() — bypasses JwtAuthGuard
│   │   ├── cached.decorator.ts          # @Cached(ttlSeconds)
│   │   └── cache-key.decorator.ts       # @CacheKey('custom-key')
│   │
│   ├── entities/
│   │   └── tenant-base.entity.ts        # Abstract: id · businessId · isActive · timestamps
│   │
│   ├── filters/
│   │   └── http-exception.filter.ts     # Global error → consistent JSON shape
│   │
│   ├── guards/
│   │   ├── jwt-auth.guard.ts            # Validates Bearer token on every route
│   │   ├── jwt.strategy.ts              # Passport JWT strategy
│   │   ├── roles.guard.ts               # Checks user.role vs @Roles(...)
│   │   ├── permission.guard.ts          # Checks customPermissions[] vs @Permission(...)
│   │   └── subscription.guard.ts        # Enforces plan limits (products, users)
│   │
│   ├── interceptors/
│   │   ├── transform.interceptor.ts     # Wraps all responses in standard envelope
│   │   ├── logging.interceptor.ts       # Logs method · URL · response time
│   │   └── cache.interceptor.ts         # Redis GET cache
│   │
│   └── shared/
│       ├── interfaces/
│       │   └── jwt-payload.interface.ts
│       └── enums/
│           └── user-role.enum.ts        # SUPER_ADMIN · ADMIN · EMPLOYEE
│
├── database/
│   └── seeds/
│       └── seed-super-admin.ts          # npm run seed:super-admin
│
└── modules/
    ├── auth/                  # OTP · JWT · refresh token · mobile register
    │   ├── controllers/       auth.controller.ts
    │   ├── dto/               forgot-password · login · mobile-auth · refresh-token · reset-password · send-otp · verify-otp
    │   ├── entities/          auth-otp.entity.ts · refresh-token.entity.ts
    │   └── services/          auth.service.ts
    │
    ├── users/                 # Profiles · roles · custom permission overrides
    ├── business/              # Business entity · shop setup · owner link
    ├── billing/               # bKash/Rocket/Nagad payment requests
    ├── packages/              # Subscription plan definitions
    ├── subscription/          # Trial · active · expired · suspended states
    ├── super-admin/           # Platform control · data reset · audit log
    │
    ├── accounting/            # Double-entry engine
    │   ├── entities/          account.entity.ts · account-ledger.entity.ts · accounting-category.entity.ts
    │   └── controllers/       accounting.controller.ts
    │
    ├── reports/               # P&L · Balance Sheet · Cash Flow · Stock reports
    │
    ├── inventory/
    │   ├── product/           # Products · variants · SKU · barcode · stock snapshots
    │   │   └── entities/      product.entity.ts · product-stock.entity.ts · stock-ledger.entity.ts
    │   ├── stock/             # Adjustments · transfers · ledger queries
    │   │   └── entities/      stock-adjustment.entity.ts · stock-transfer.entity.ts
    │   ├── category/          # Tree-structured categories
    │   ├── brand/
    │   ├── unit/
    │   ├── warehouse/
    │   └── warranty/
    │
    ├── purchase/              # Suppliers · purchase invoices · purchase returns
    │   └── entities/          purchase.entity.ts · purchase-return.entity.ts
    │                          supplier.entity.ts · supplier-adjustment.entity.ts
    │
    ├── sales/                 # Customers · sales · returns · quotations · POS · coupons
    │   └── entities/          sale.entity.ts · sale-return.entity.ts · customer.entity.ts
    │                          customer-adjustment.entity.ts · customer-type.entity.ts
    │                          quotation.entity.ts · coupon.entity.ts
    │
    ├── hrm/                   # Full HRM suite
    │   └── entities/          employee.entity.ts · attendance.entity.ts · leave.entity.ts
    │                          payroll.entity.ts · loan.entity.ts · kpi.entity.ts
    │                          department.entity.ts · designation.entity.ts
    │
    ├── affiliate/             # Referral codes · MLM / commission tracking
    ├── sms-marketing/         # SMS campaigns and broadcast
    ├── image-upload/          # AWS S3 + ImageKit integration
    └── mail/                  # Nodemailer transactional email service
```

---

## Module Reference

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/mobile/send-otp` | Public | Send OTP to mobile (dev fixed: `123456`) |
| POST | `/mobile/verify-otp` | Public | Verify OTP → login or tempToken for new user |
| POST | `/mobile/register` | Public | Complete registration using tempToken |
| POST | `/admin-login` | Public | Email + password (admin/super_admin only) |
| POST | `/refresh` | Public | Rotate access + refresh tokens |
| POST | `/logout` | JWT | Revoke current refresh token |
| POST | `/forgot-password` | Public | Send password-reset OTP via email |
| POST | `/verify-otp` | Public | Verify password-reset OTP → resetToken |
| POST | `/reset-password` | Public | Set new password using resetToken |

### Inventory — `/api/v1/inventory`

| Resource | Key Operations |
|---|---|
| Products | CRUD, search, barcode lookup, variant management |
| Stock Ledger | Append-only history by product / warehouse / date |
| Stock Adjustments | Plus / minus corrections with reason |
| Stock Transfers | Warehouse-to-warehouse with auto ledger entries |
| Categories | CRUD with tree hierarchy |
| Brands | CRUD |
| Units | CRUD |
| Warehouses | CRUD, set default warehouse per business |
| Warranties | CRUD |

### Purchase — `/api/v1/purchase`

| Resource | Key Operations |
|---|---|
| Suppliers | CRUD, running ledger, balance, debit/credit adjustment |
| Purchases | Create/list/detail invoice; stock IN on create |
| Purchase Returns | Return stock OUT, supplier credit note |

### Sales — `/api/v1/sales`

| Resource | Key Operations |
|---|---|
| Customers | CRUD, running ledger, balance, aging, adjustment |
| Sales | Create invoice with profit per item, list, detail |
| Sale Returns | Stock reversal, customer refund |
| Quotations | Create, list, convert to sale invoice |
| POS Terminal | Fast billing, barcode, hold/resume, multi-payment |
| Coupons | CRUD, percentage / fixed discount |

### Accounting — `/api/v1/accounting`

| Resource | Key Operations |
|---|---|
| Accounts | CRUD (cash / bank / mobile banking) |
| Account Ledger | Query by account, date range, transaction type |
| Transactions | Manual expense / income entry |
| Reports | Profit & Loss, Balance Sheet, Trial Balance, Cash Flow |

### HRM — `/api/v1/hrm`

| Resource | Key Operations |
|---|---|
| Employees | Full profile CRUD |
| Departments | CRUD |
| Designations | CRUD |
| Attendance | Manual check-in/out, monthly summary |
| Leave | Types, employee requests, manager approval |
| Payroll | Structure, generate monthly payroll, approve, payslip |
| Loans | Create loan, installment tracking, payroll deduction |
| KPI | Evaluation templates, scoring, ratings |

### Super Admin — `/api/v1/super-admin`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Platform stats (businesses, revenue, plan breakdown) |
| GET | `/businesses` | Paginated list of all businesses |
| PATCH | `/businesses/:id/subscription` | Renew · change plan · suspend · unsuspend · extend trial |
| POST | `/businesses/:id/reset` | Scoped data wipe (transactions / inventory / HRM / all) |
| GET | `/payment-requests` | All manual payment requests |
| PATCH | `/payment-requests/:id` | Approve or reject payment |
| GET/POST/PATCH | `/packages` | Subscription package management |

---

## Architecture & Patterns

### Multi-tenancy via TenantBaseEntity

```typescript
export abstract class TenantBaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'business_id' })
  businessId: string;            // injected from JWT on every request

  @Column({ default: true })
  isActive: boolean;             // soft delete flag

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

Every tenant entity extends this. The controller extracts `businessId` via `@BusinessId()` and passes it to the service — no tenant can ever access another tenant's rows.

### DTO Validation Pattern

```typescript
export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  openingStock?: number;
}
```

`ValidationPipe` is global with `whitelist: true` + `forbidNonWhitelisted: true`. Unknown properties in the request body are rejected before reaching the controller.

### Request Lifecycle

```
HTTP Request
  → Helmet (security headers)
  → CORS
  → ValidationPipe (DTO binding + validation)
  → JwtAuthGuard  (verify Bearer token)
  → RolesGuard    (check user.role)
  → PermissionGuard (check customPermissions[])
  → SubscriptionGuard (enforce plan limits)
  → Controller handler
  → Service (business logic + QueryRunner transaction)
  → TransformInterceptor (wrap in standard envelope)
→ HTTP Response
```

---

## Authentication

### Mobile OTP Login Flow

```
1. POST /auth/mobile/send-otp    { mobile }
      Deletes old unused OTP for this mobile
      Creates bcrypt-hashed OTP (dev: 123456, TTL: 10 min)

2. POST /auth/mobile/verify-otp  { mobile, code }
      Verifies bcrypt hash · marks OTP used
      ┌─ User found by mobile ─→ { isNewUser: false, accessToken, refreshToken, user }
      └─ No user found      ─→ { isNewUser: true, tempToken }  (JWT, scope: mobile_register, 15 min)

3. POST /auth/mobile/register    { tempToken, name, password }
      Verifies tempToken scope
      ── Single atomic transaction ──
        1. Create UserEntity   (role: ADMIN, isVerified: true)
        2. Create BusinessEntity (15-day trial, currencyCode: BDT)
        3. Create AccountEntity  (Petty Cash, isDefault: true, type: CASH)
        4. Persist RefreshTokenEntity (SHA-256 hashed)
      ──────────────────────────────
      → { isNewUser: true, accessToken, refreshToken, user }
```

### JWT Payload

```typescript
interface JwtPayload {
  sub:        string;    // user UUID
  email:      string;
  role:       UserRole;  // SUPER_ADMIN | ADMIN | EMPLOYEE
  name:       string;
  businessId: string;    // tenant isolation key
}
```

Refresh tokens are stored as SHA-256 hashes in `refresh_tokens` table. On each rotation, the old hash is revoked and a new row inserted.

---

## Guards & Decorators

| Guard | Applied at | Purpose |
|---|---|---|
| `JwtAuthGuard` | Global | Validates Bearer token (skip with `@Public()`) |
| `RolesGuard` | Per-handler | Checks `user.role` vs `@Roles(...)` |
| `PermissionGuard` | Per-handler | Checks `user.customPermissions[]` vs `@Permission(...)` |
| `SubscriptionGuard` | Per-handler | Rejects if plan limits are exceeded |

| Decorator | Usage example |
|---|---|
| `@CurrentUser()` | `@CurrentUser() user: JwtPayload` |
| `@BusinessId()` | `@BusinessId() businessId: string` |
| `@Roles(UserRole.ADMIN)` | Restrict to admin role |
| `@Permission('sales.create')` | Fine-grained per-endpoint permission |
| `@Public()` | Skip auth entirely (login, register, OTP endpoints) |
| `@Cached(300)` | Cache response in Redis for 300 seconds |
| `@CacheKey('products-list')` | Override Redis key for cached endpoint |

---

## Interceptors & Filters

### TransformInterceptor

Every successful response is wrapped:

```json
{
  "success": true,
  "data": { },
  "statusCode": 201,
  "timestamp": "2026-06-29T00:41:18.509Z",
  "path": "/api/v1/auth/mobile/verify-otp"
}
```

### HttpExceptionFilter

All thrown `HttpException` instances are formatted identically with `"success": false` so the client always has a predictable shape regardless of error type.

### LoggingInterceptor

Logs `[NestJS] POST /api/v1/products — 42ms` to stdout for every request.

---

## Database Design

### Naming conventions

- Table names: `snake_case` plural (`stock_ledger`, `account_ledgers`)
- UUID primary keys everywhere (`gen_random_uuid()`)
- `business_id` on every tenant table
- Soft delete via `is_active BOOLEAN DEFAULT true`
- `created_at` + `updated_at` on every table

### Precision rules

```sql
-- All money
amount   DECIMAL(15,2)   -- e.g. 1234567890.12

-- All stock quantities
qty      DECIMAL(15,4)   -- e.g. 1234.5678
```

### Key tables

| Entity | Table | Notes |
|---|---|---|
| `UserEntity` | `users` | mobile (unique), email, role, customPermissions |
| `BusinessEntity` | `businesses` | ownerId FK, subscription state, trial dates |
| `OtpEntity` | `otps` | bcrypt-hashed code, purpose, attempts, used flag |
| `RefreshTokenEntity` | `refresh_tokens` | SHA-256 hash, isRevoked, device info |
| `AccountEntity` | `accounts` | type enum, openingBalance, currentBalance, isDefault |
| `AccountLedgerEntity` | `account_ledgers` | debit, credit, balanceAfter (append-only) |
| `ProductEntity` | `products` | SKU, barcode, variants |
| `ProductStockEntity` | `product_stocks` | per-warehouse snapshot (inQty, outQty, currentQty, reservedQty) |
| `StockLedgerEntity` | `stock_ledger` | qtyIn, qtyOut, balanceAfter (append-only) |
| `SaleEntity` | `sales` | subtotal, discount, tax, total, paid, due, profit |
| `PurchaseEntity` | `purchases` | subtotal, discount, tax, total, paid, due |
| `EmployeeEntity` | `employees` | employeeCode, departmentId, designationId, joinDate |
| `PayrollEntity` | `payrolls` | month, year, grossSalary, totalDeduction, netSalary |
| `AttendanceEntity` | `attendances` | date, checkIn, checkOut, status |

---

## Transaction Strategy

Every operation that touches more than one table uses a TypeORM `QueryRunner`:

```typescript
const qr = this.dataSource.createQueryRunner();
await qr.connect();
await qr.startTransaction();
try {
  const sale = await qr.manager.save(SaleEntity, saleData);
  for (const item of dto.items) {
    await qr.manager.save(SaleItemEntity, { ...item, saleId: sale.id });
    // Append stock ledger row
    await qr.manager.save(StockLedgerEntity, { ...ledgerData });
    // Update stock snapshot
    await qr.manager.update(ProductStockEntity, { id: stock.id }, { currentQty: newQty });
  }
  // Customer ledger
  await qr.manager.save(CustomerLedgerEntity, customerEntry);
  // Double-entry accounting (2 rows per event)
  await qr.manager.save(AccountLedgerEntity, [debitRow, creditRow]);

  await qr.commitTransaction();
  return sale;
} catch (err) {
  await qr.rollbackTransaction();  // atomic — nothing partial is left
  throw err;
} finally {
  await qr.release();
}
```

**Sale creation** touches 6 tables atomically.
**Registration** touches 4 tables (users, businesses, accounts, refresh_tokens) atomically.

---

## Redis Caching

| Key Pattern | TTL | Invalidated when |
|---|---|---|
| `business:{id}:subscription` | 5 min | Subscription changes |
| `business:{id}:default_warehouse` | 1 hour | Warehouse update |
| `product:{id}:stock:{warehouseId}` | 30 sec | Any stock movement |
| `report:{businessId}:{type}:{date}` | 10 min | New transaction in period |
| `rate_limit:{ip}` | 1 min | Auto-expires |

---

## API Response Format

### Success response

```json
{
  "success": true,
  "data": {
    "isNewUser": false,
    "user": { "id": "uuid", "name": "Shamim", "role": "admin" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "statusCode": 200,
  "timestamp": "2026-06-29T00:41:18.509Z",
  "path": "/api/v1/auth/mobile/verify-otp"
}
```

### Error response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid OTP",
  "timestamp": "2026-06-29T00:41:18.509Z",
  "path": "/api/v1/auth/mobile/verify-otp"
}
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ── App ──────────────────────────────────────────────
PORT=5004
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ── Database ─────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/solvexbd_erp

# ── Redis ────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ── JWT ──────────────────────────────────────────────
JWT_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_TOKEN_TTL=3600          # 1 hour in seconds
JWT_REFRESH_TOKEN_TTL=604800       # 7 days in seconds
JWT_ISSUER=solvexbd-erp
JWT_AUDIENCE=localhost:5000
SUPER_ADMIN_JWT_SECRET=separate_super_admin_secret_never_share

# ── AWS S3 ───────────────────────────────────────────
AWS_BUCKET=solvexbd-uploads
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# ── ImageKit ─────────────────────────────────────────
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

# ── Email (Nodemailer) ───────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# ── Business Rules ───────────────────────────────────
TRIAL_DAYS=15
```

---

## Installation & Running

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Redis 7

### Development

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Start development server (watch mode)
npm run start:dev
```

API: `http://localhost:5004/api/v1`
Swagger: `http://localhost:5004/api/docs`

### Production

```bash
# Build
npm run build

# Run compiled output
npm run start:prod

# Or with PM2
pm2 start dist/main.js --name solvexbd-api
pm2 save && pm2 startup
```

### Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Development server with file watching |
| `npm run start:prod` | Run compiled production build |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run lint` | ESLint check + auto-fix |
| `npm run format` | Prettier formatting |
| `npm run test` | Jest unit tests |
| `npm run test:cov` | Test coverage report |
| `npm run seed:super-admin` | Create initial super admin account |

### Seeding Super Admin

```bash
npm run seed:super-admin
```

Super Admin accounts are seeded directly — they cannot be created through the public API. The Super Admin JWT uses a completely separate secret (`SUPER_ADMIN_JWT_SECRET`) and a `super_admin` role that regular tenant JWTs can never claim.

---

## Author

**Md. Shamim Hossain** — Full-Stack Developer

- GitHub: [github.com/shamimhossain515419](https://github.com/shamimhossain515419)
- Email: elias.irozen@gmail.com
