/**
 * Super Admin Seed Script
 * Run: npm run seed:super-admin
 *
 * Creates a super_admin user if one doesn't already exist.
 * Change the credentials below before running in production.
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Load .env.development (or .env in production)
const envFile =
  process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// ── Seed credentials — change these before going live ────────────────────────
const SUPER_ADMIN = {
  name: 'Super Admin',
  email: 'superadmin@bizcore.com',
  password: 'SuperAdmin@123',
  mobile: '01000000000',
};
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // Build a standalone DataSource (matches app.module config)
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:
      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    // We use raw queries — no entities needed
    entities: [],
    synchronize: false,
  });

  await ds.initialize();
  console.log('✅ Database connected');

  // Check if a super_admin already exists
  const existing = await ds.query(
    `SELECT id FROM users WHERE role = 'super_admin' LIMIT 1`,
  );

  if (existing.length > 0) {
    console.log(
      '⚠️  Super admin already exists. Skipping seed.\n   Email:',
      SUPER_ADMIN.email,
    );
    await ds.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash(SUPER_ADMIN.password, 12);

  // Generate a simple referral code
  const referralCode = 'SA-' + Math.random().toString(36).slice(2, 8).toUpperCase();

  await ds.query(
    `INSERT INTO users
       (id, name, email, mobile, password, role, "isVerified", "referralCode", "createdAt", "updatedAt")
     VALUES
       (gen_random_uuid(), $1, $2, $3, $4, 'super_admin', true, $5, NOW(), NOW())`,
    [
      SUPER_ADMIN.name,
      SUPER_ADMIN.email,
      SUPER_ADMIN.mobile,
      passwordHash,
      referralCode,
    ],
  );

  console.log('\n🎉 Super admin seeded successfully!');
  console.log('─────────────────────────────────────');
  console.log('  Email    :', SUPER_ADMIN.email);
  console.log('  Password :', SUPER_ADMIN.password);
  console.log('  Role     : super_admin');
  console.log('  Login at : /super-admin/login');
  console.log('─────────────────────────────────────');
  console.log('⚠️  Change the password after first login!\n');

  await ds.destroy();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
