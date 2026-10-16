import { describe, expect, it } from "vitest";

import { readWebhook } from "./webhook-events";

const payment = { id: "pay_1", order_id: "order_1", amount: 12900, currency: "INR", status: "captured", amount_refunded: 0 };
const event = (name: string, entity: object = payment) => ({ event: name, payload: { payment: { entity } } });

describe("reading Razorpay webhooks", () => {
  it("treat order.paid and payment.captured as paid", () => {
    const paid = { kind: "paid", orderId: "order_1", paymentId: "pay_1", amountPaise: 12900, currency: "INR" };
    expect(readWebhook(event("order.paid"))).toEqual(paid);
    expect(readWebhook(event("payment.captured"))).toEqual(paid);
  });

  it("don't count a payment that's only authorized", () => {
    expect(readWebhook(event("payment.captured", { ...payment, status: "authorized" }))).toEqual({ kind: "ignored", event: "payment.captured" });
  });

  it("read failures and refunds", () => {
    expect(readWebhook(event("payment.failed", { ...payment, status: "failed" }))).toEqual({ kind: "failed", orderId: "order_1", paymentId: "pay_1" });
    expect(readWebhook(event("refund.processed", { ...payment, status: "refunded", amount_refunded: 12900 }))).toEqual({
      kind: "refunded",
      paymentId: "pay_1",
      amountPaise: 12900,
      refundedPaise: 12900,
    });
  });

  it("ignore other events and malformed bodies", () => {
    expect(readWebhook(event("payment.authorized"))).toMatchObject({ kind: "ignored" });
    expect(readWebhook(null)).toMatchObject({ kind: "ignored" });
    expect(readWebhook({ event: "order.paid", payload: { payment: { entity: { id: "pay_1", amount: "12900" } } } })).toMatchObject({ kind: "ignored" });
  });
});
