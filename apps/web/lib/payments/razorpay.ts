import "server-only";

// The Razorpay Orders API, called directly with fetch (no SDK). Test and live
// differ only by the keys in the environment.
export function razorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null; // buying is off until keys are set
  return { keyId, keySecret, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? null };
}

export type RazorpayConfig = NonNullable<ReturnType<typeof razorpayConfig>>;

// An order fixes the amount before Checkout opens: the browser can't change it.
export async function createRazorpayOrder(
  config: RazorpayConfig,
  order: { amountPaise: number; receipt: string; notes: Record<string, string> }
) {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({ amount: order.amountPaise, currency: "INR", receipt: order.receipt, notes: order.notes }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: { description?: string } } | null;
    throw new Error(`Razorpay refused the order (${response.status}): ${detail?.error?.description ?? "no details"}`);
  }
  const created = (await response.json()) as { id: string };
  return { id: created.id };
}
