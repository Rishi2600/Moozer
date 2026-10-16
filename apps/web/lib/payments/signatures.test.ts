import { describe, expect, it } from "vitest";

import { checkoutSignatureValid, signForTests, webhookSignatureValid } from "./signatures";

const KEY_SECRET = "test-key-secret-000000000";
const WEBHOOK_SECRET = "a".repeat(64);

describe("Checkout signatures", () => {
  const good = signForTests("order_IEIaMR65cu6nz3|pay_IH4NVgf4Dreq1l", KEY_SECRET);

  it("accept Razorpay's signature for our order and its payment", () => {
    expect(checkoutSignatureValid("order_IEIaMR65cu6nz3", "pay_IH4NVgf4Dreq1l", good, KEY_SECRET)).toBe(true);
  });

  it("reject a signature for another order, another payment, or another secret", () => {
    expect(checkoutSignatureValid("order_OTHER", "pay_IH4NVgf4Dreq1l", good, KEY_SECRET)).toBe(false);
    expect(checkoutSignatureValid("order_IEIaMR65cu6nz3", "pay_OTHER", good, KEY_SECRET)).toBe(false);
    expect(checkoutSignatureValid("order_IEIaMR65cu6nz3", "pay_IH4NVgf4Dreq1l", good, "another-secret")).toBe(false);
  });

  it("reject junk without throwing", () => {
    expect(checkoutSignatureValid("o", "p", undefined, KEY_SECRET)).toBe(false);
    expect(checkoutSignatureValid("o", "p", "short", KEY_SECRET)).toBe(false);
  });

  it("match the formula: HMAC-SHA256 of 'order|payment' in hex", () => {
    // Computed independently: echo -n "order_1|pay_1" | openssl dgst -sha256 -hmac "secret"
    expect(signForTests("order_1|pay_1", "secret")).toBe("52115a0d3400de9e86aade1f1b6eba9e8974604f4e267a9e9a16633a4c8dd2cb");
  });
});

describe("Webhook signatures", () => {
  const body = '{"event":"order.paid","payload":{}}';

  it("accept the exact body Razorpay signed", () => {
    expect(webhookSignatureValid(body, signForTests(body, WEBHOOK_SECRET), WEBHOOK_SECRET)).toBe(true);
  });

  it("reject a body changed by even a space", () => {
    const signature = signForTests(body, WEBHOOK_SECRET);
    expect(webhookSignatureValid(body.replace(":", ": "), signature, WEBHOOK_SECRET)).toBe(false);
  });
});
