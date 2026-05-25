// ─────────────────────────────────────────────────────────────
// Binary Tree: position of a user under their parent node
// ─────────────────────────────────────────────────────────────
export enum Position {
  LEFT = 'left',
  RIGHT = 'right',
}

// ─────────────────────────────────────────────────────────────
// Which MLM system a record/query belongs to
// ─────────────────────────────────────────────────────────────
export enum PlacementType {
  BINARY = 'binary',
  MATRIX = 'matrix',
}

// ─────────────────────────────────────────────────────────────
// User account status
// ─────────────────────────────────────────────────────────────
export enum UserStatus {
  ACTIVE = 'active',       // Normal, fully functioning account
  INACTIVE = 'inactive',   // Registered but not yet activated
  SUSPENDED = 'suspended', // Temporarily blocked by admin
  BANNED = 'banned',       // Permanently blocked
}

// ─────────────────────────────────────────────────────────────
// Withdrawal / payout request status
// ─────────────────────────────────────────────────────────────
export enum WithdrawalStatus {
  PENDING = 'pending',     // Submitted, awaiting admin review
  APPROVED = 'approved',   // Admin approved, payment queued
  PAID = 'paid',           // Payment confirmed and sent
  REJECTED = 'rejected',   // Admin rejected the request
}

// ─────────────────────────────────────────────────────────────
// Commission / earning transaction types
// ─────────────────────────────────────────────────────────────
export enum CommissionType {
  DIRECT_REFERRAL = 'direct_referral',     // Earned when you directly refer someone
  BINARY_MATCHING = 'binary_matching',     // Binary leg matching bonus
  MATRIX_LEVEL = 'matrix_level',           // Matrix level completion bonus
  RANK_BONUS = 'rank_bonus',               // Bonus for achieving a rank
  LEADERSHIP_BONUS = 'leadership_bonus',   // Bonus from downline leaders
  OVERRIDING = 'overriding',               // Override commission from deep levels
}

// ─────────────────────────────────────────────────────────────
// Transaction status (wallet / ledger entries)
// ─────────────────────────────────────────────────────────────
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

// ─────────────────────────────────────────────────────────────
// Transaction type (credit or debit on the wallet)
// ─────────────────────────────────────────────────────────────
export enum TransactionType {
  CREDIT = 'credit',   // Money added (commission, bonus, deposit)
  DEBIT = 'debit',     // Money removed (withdrawal, fee)
}

// ─────────────────────────────────────────────────────────────
// User rank / tier in the MLM hierarchy
// ─────────────────────────────────────────────────────────────
export enum UserRank {
  STARTER = 'starter',         // Default rank on joining
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  AMBASSADOR = 'ambassador',   // Top-tier rank
}

// ─────────────────────────────────────────────────────────────
// Binary tree leg side — used in matching bonus calculations
// ─────────────────────────────────────────────────────────────
export enum BinaryLeg {
  LEFT = 'left',
  RIGHT = 'right',
}

// ─────────────────────────────────────────────────────────────
// Notification type — for in-app notification system
// ─────────────────────────────────────────────────────────────
export enum NotificationType {
  NEW_REFERRAL = 'new_referral',           // Someone joined under you
  COMMISSION_EARNED = 'commission_earned', // You received a commission
  WITHDRAWAL_UPDATE = 'withdrawal_update', // Your withdrawal status changed
  RANK_UPGRADE = 'rank_upgrade',           // You reached a new rank
  SYSTEM_ALERT = 'system_alert',           // Admin broadcast message
}

// ─────────────────────────────────────────────────────────────
// KYC (Know Your Customer) verification status
// ─────────────────────────────────────────────────────────────
export enum KycStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',       // Documents uploaded, awaiting review
  APPROVED = 'approved',
  REJECTED = 'rejected',     // Admin rejected, user must resubmit
}

// ─────────────────────────────────────────────────────────────
// Package / plan a user is enrolled in
// ─────────────────────────────────────────────────────────────
export enum PackageStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
} 