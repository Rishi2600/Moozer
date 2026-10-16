-- A money refund takes an order's boosts back at most once, however many
-- times Razorpay sends the refund webhook.
CREATE UNIQUE INDEX "boost_ledger_one_reversal_per_order" ON "boost_ledger"("orderId") WHERE "reason" = 'reversal';
ALTER TABLE "boost_ledger" ADD CONSTRAINT "boost_ledger_reversal_has_order" CHECK ("reason" <> 'reversal' OR "orderId" IS NOT NULL);
