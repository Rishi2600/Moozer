import { createHmac, timingSafeEqual } from "node:crypto";

// Razorpay signs with HMAC-SHA256, hex encoded. Compared in constant time so
// a forger learns nothing from how quickly a wrong signature is refused.
function matches(expected: string, given: unknown) {
  if (typeof given !== "string" || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}
const hmac = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest("hex");

// What Checkout hands the browser after a payment: "<order id>|<payment id>"
// signed with the key secret. Proves Razorpay took that payment for our order.
export function checkoutSignatureValid(orderId: string, paymentId: string, signature: unknown, keySecret: string) {
  return matches(hmac(`${orderId}|${paymentId}`, keySecret), signature);
}

// A webhook's raw body signed with the webhook secret (X-Razorpay-Signature).
// Must be the exact bytes received: re-serialised JSON would differ.
export function webhookSignatureValid(rawBody: string, signature: unknown, webhookSecret: string) {
  return matches(hmac(rawBody, webhookSecret), signature);
}

export const signForTests = hmac;
