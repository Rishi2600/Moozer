-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('razorpay', 'coupon');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('created', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "CouponScope" AS ENUM ('all', 'packs');

-- AlterTable
ALTER TABLE "boost_ledger" ADD COLUMN     "orderId" TEXT;

-- CreateTable
CREATE TABLE "coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percentOff" INTEGER NOT NULL,
    "appliesTo" "CouponScope" NOT NULL DEFAULT 'all',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxRedemptions" INTEGER,
    "perUserLimit" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "pack" TEXT NOT NULL,
    "boosts" INTEGER NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "couponId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'created',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "payment_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupon_code_key" ON "coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payment_order_providerOrderId_key" ON "payment_order"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_order_providerPaymentId_key" ON "payment_order"("providerPaymentId");

-- CreateIndex
CREATE INDEX "payment_order_userId_createdAt_idx" ON "payment_order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_order_couponId_userId_idx" ON "payment_order"("couponId", "userId");

-- AddForeignKey
ALTER TABLE "boost_ledger" ADD CONSTRAINT "boost_ledger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "payment_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Coupons: upper-case codes of letters, digits and dashes; a real discount.
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_code_format" CHECK ("code" ~ '^[A-Z0-9-]{3,32}$');
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_percent_off_range" CHECK ("percentOff" BETWEEN 1 AND 100);
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_limits_positive" CHECK (("maxRedemptions" IS NULL OR "maxRedemptions" > 0) AND ("perUserLimit" IS NULL OR "perUserLimit" > 0));

-- Orders: positive boosts, no negative amounts, paidAt exactly when paid
-- (or refunded after paying). A coupon order is free, names its coupon and
-- has no Razorpay ids; a Razorpay order has its order id from the start.
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_boosts_positive" CHECK ("boosts" > 0);
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_amount_not_negative" CHECK ("amountPaise" >= 0);
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_paid_at_matches_status" CHECK (("status" IN ('paid', 'refunded')) = ("paidAt" IS NOT NULL));
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_coupon_orders_are_free" CHECK (
  "provider" <> 'coupon' OR ("amountPaise" = 0 AND "couponId" IS NOT NULL AND "providerOrderId" IS NULL AND "providerPaymentId" IS NULL)
);
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_razorpay_has_order_id" CHECK ("provider" <> 'razorpay' OR "providerOrderId" IS NOT NULL);

-- The wallet: a purchase always points at its order, and an order credits
-- the wallet at most once.
ALTER TABLE "boost_ledger" ADD CONSTRAINT "boost_ledger_purchase_has_order" CHECK ("reason" <> 'purchase' OR "orderId" IS NOT NULL);
CREATE UNIQUE INDEX "boost_ledger_one_credit_per_order" ON "boost_ledger"("orderId") WHERE "reason" IN ('purchase', 'grant');
