// The webhook events we act on, read from Razorpay's JSON. Anything else (or
// anything malformed) is "ignored": acknowledged so Razorpay stops retrying.
export type PaymentEvent =
  | { kind: "paid"; orderId: string; paymentId: string; amountPaise: number; currency: string }
  | { kind: "failed"; orderId: string; paymentId: string }
  | { kind: "refunded"; paymentId: string; amountPaise: number; refundedPaise: number }
  | { kind: "ignored"; event: string };

type Entity = Record<string, unknown>;
const entity = (payload: unknown, name: string): Entity | null => {
  const wrapper = (payload as Record<string, { entity?: Entity }> | null)?.[name];
  return wrapper?.entity && typeof wrapper.entity === "object" ? wrapper.entity : null;
};
const text = (value: unknown) => (typeof value === "string" && value ? value : null);
const paise = (value: unknown) => (Number.isInteger(value) && (value as number) >= 0 ? (value as number) : null);

export function readWebhook(body: unknown): PaymentEvent {
  const event = text((body as Entity | null)?.event) ?? "unknown";
  const payment = entity((body as Entity | null)?.payload, "payment");
  const ignored = { kind: "ignored" as const, event };
  if (!payment) return ignored;
  const paymentId = text(payment.id);
  const orderId = text(payment.order_id);
  if (!paymentId) return ignored;

  if (event === "order.paid" || event === "payment.captured") {
    const amountPaise = paise(payment.amount);
    const currency = text(payment.currency);
    if (!orderId || amountPaise === null || !currency || payment.status !== "captured") return ignored;
    return { kind: "paid", orderId, paymentId, amountPaise, currency };
  }
  if (event === "payment.failed") return orderId ? { kind: "failed", orderId, paymentId } : ignored;
  if (event === "refund.processed") {
    const amountPaise = paise(payment.amount);
    const refundedPaise = paise(payment.amount_refunded);
    if (amountPaise === null || refundedPaise === null) return ignored;
    return { kind: "refunded", paymentId, amountPaise, refundedPaise };
  }
  return ignored;
}
