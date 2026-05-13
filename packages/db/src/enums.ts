// SQLite doesn't support Prisma enums, so we encode the allowed string values
// here. Each export is *both* a string-literal union (for compile-time checks)
// and a frozen object of the canonical literals (so call sites can write
// `Market.US` exactly as they would with a real enum).
//
// When we switch to Postgres these can be deleted in favor of generated enums.

export const Market = { US: "US", MX: "MX" } as const;
export type Market = (typeof Market)[keyof typeof Market];

export const Locale = { en: "en", es_MX: "es-MX" } as const;
export type Locale = (typeof Locale)[keyof typeof Locale];

export const UserRole = {
  buyer: "buyer",
  seller: "seller",
  dealer: "dealer",
  admin: "admin",
  moderator: "moderator",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const KycStatus = { none: "none", pending: "pending", verified: "verified", rejected: "rejected" } as const;
export type KycStatus = (typeof KycStatus)[keyof typeof KycStatus];

export const ListingStatus = {
  draft: "draft",
  pending_review: "pending_review",
  active: "active",
  paused: "paused",
  sold: "sold",
  removed: "removed",
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

export const SaleType = { fixed: "fixed", offer: "offer", auction: "auction" } as const;
export type SaleType = (typeof SaleType)[keyof typeof SaleType];

export const Condition = {
  new: "new",
  like_new: "like_new",
  used_good: "used_good",
  used_fair: "used_fair",
  for_parts: "for_parts",
} as const;
export type Condition = (typeof Condition)[keyof typeof Condition];

export const Transmission = { manual: "manual", automatic: "automatic", cvt: "cvt", dct: "dct" } as const;
export type Transmission = (typeof Transmission)[keyof typeof Transmission];

export const FuelType = { gas: "gas", diesel: "diesel", hybrid: "hybrid", ev: "ev", lpg: "lpg" } as const;
export type FuelType = (typeof FuelType)[keyof typeof FuelType];

export const Drivetrain = { fwd: "fwd", rwd: "rwd", awd: "awd", fourwd: "4wd" } as const;
export type Drivetrain = (typeof Drivetrain)[keyof typeof Drivetrain];

export const AccidentHistory = { none: "none", minor: "minor", major: "major", unknown: "unknown" } as const;
export type AccidentHistory = (typeof AccidentHistory)[keyof typeof AccidentHistory];

export const TitleStatus = { clean: "clean", salvage: "salvage", rebuilt: "rebuilt", lien: "lien" } as const;
export type TitleStatus = (typeof TitleStatus)[keyof typeof TitleStatus];

export const OfferStatus = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
  withdrawn: "withdrawn",
  countered: "countered",
  expired: "expired",
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

export const OrderStatus = {
  pending: "pending",
  paid: "paid",
  shipped: "shipped",
  delivered: "delivered",
  completed: "completed",
  cancelled: "cancelled",
  refunded: "refunded",
  disputed: "disputed",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentProvider = { stripe: "stripe", mercadopago: "mercadopago" } as const;
export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];

export const PaymentStatus = {
  initiated: "initiated",
  authorized: "authorized",
  succeeded: "succeeded",
  failed: "failed",
  refunded: "refunded",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ModerationDecision = {
  approved: "approved",
  rejected: "rejected",
  needs_review: "needs_review",
} as const;
export type ModerationDecision = (typeof ModerationDecision)[keyof typeof ModerationDecision];

export const ModerationReason = {
  prohibited_item: "prohibited_item",
  duplicate_image: "duplicate_image",
  price_anomaly: "price_anomaly",
  invalid_vin: "invalid_vin",
  policy_violation: "policy_violation",
  spam: "spam",
  other: "other",
} as const;
export type ModerationReason = (typeof ModerationReason)[keyof typeof ModerationReason];
