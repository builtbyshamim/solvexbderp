import type { Package } from '../redux/api/packagesApi';

// Yearly = monthly × 12 × 0.70  (30 % off)
// Starter: 500 × 12 × 0.70 = 4,200
// Pro:   1,200 × 12 × 0.70 = 10,080

export const MOCK_PACKAGES: Package[] = [
  {
    id: 'starter',
    name: 'Starter',
    badge: undefined,
    highlight: false,
    isEnterprise: false,
    isActive: true,
    monthlyPrice: 500,
    yearlyPrice: 4200,          // 30 % off
    trialDays: 15,
    maxUsers: 3,
    maxProducts: 500,
    maxWarehouses: 1,
    features: [
      '3 users included',
      '500 products',
      '1 warehouse',
      'POS terminal',
      'Inventory, Purchase & Sales',
      'Basic reports',
      'SMS marketing',
      '15-day free trial',
      'Email support',
    ],
    sortOrder: 1,
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Most Popular',
    highlight: true,
    isEnterprise: false,
    isActive: true,
    monthlyPrice: 1200,
    yearlyPrice: 10080,         // 30 % off
    trialDays: 15,
    maxUsers: 25,
    maxProducts: -1,
    maxWarehouses: 5,
    features: [
      '25 users included',
      'Unlimited products',
      '5 warehouses',
      'Full POS + offline mode',
      'Full HRM suite',
      'Double-entry accounting',
      'Complete reports & export',
      'Advanced SMS campaigns',
      'Priority 24 / 7 support',
    ],
    sortOrder: 2,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Custom',
    highlight: false,
    isEnterprise: true,
    isActive: true,
    monthlyPrice: 0,
    yearlyPrice: 0,
    trialDays: 15,
    maxUsers: -1,
    maxProducts: -1,
    maxWarehouses: -1,
    features: [
      'Unlimited users',
      'Unlimited products & warehouses',
      'Multi-branch support',
      'Dedicated account manager',
      'Custom integrations & APIs',
      'SLA guarantee',
      'On-premise deployment option',
      'Custom billing cycle',
    ],
    sortOrder: 3,
  },
];

/** Yearly discount % vs paying monthly for 12 months — fully dynamic */
export function yearlyDiscount(pkg: Package): number {
  if (pkg.monthlyPrice === 0) return 0;
  const fullYear = pkg.monthlyPrice * 12;
  return Math.round(((fullYear - pkg.yearlyPrice) / fullYear) * 100);
}

/** Monthly equivalent when billed yearly */
export function monthlyEquivalent(pkg: Package): number {
  return Math.round(pkg.yearlyPrice / 12);
}

/**
 * The discount % shown on the billing toggle badge.
 * Uses the first non-enterprise plan so the toggle always reflects real data.
 */
export function representativeYearlyDiscount(packages: Package[]): number {
  const first = packages.find((p) => !p.isEnterprise && p.monthlyPrice > 0);
  return first ? yearlyDiscount(first) : 0;
}
