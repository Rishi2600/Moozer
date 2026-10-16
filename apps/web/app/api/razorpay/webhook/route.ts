import { settleFailed, settlePaid, settleRefunded } from "@/lib/payments/orders";
import { razorpayConfig } from "@/lib/payments/razorpay";
import { webhookSignatureValid } from "@/lib/payments/signatures";
import { readWebhook } from "@/lib/payments/webhook-events";

// Razorpay calls this when payments are captured, fail or are refunded. It's
// the safety net for when the browser never reports back (a closed tab, a
// phone that dropped the page during UPI). Every call is signed with our
// webhook secret, and handling the same event twice changes nothing.
// A 5xx makes Razorpay retry; 2xx means "done, stop sending".
export async function POST(request: Request) {
  const config = razorpayConfig();
  if (!config?.webhookSecret) return new Response("Payments aren't configured.", { status: 503 });
  const raw = await request.text(); // the exact bytes Razorpay signed
  if (!webhookSignatureValid(raw, request.headers.get("x-razorpay-signature"), config.webhookSecret)) {
    console.warn("razorpay webhook: bad signature");
    return new Response("Bad signature.", { status: 400 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Not JSON.", { status: 400 });
  }
  const event = readWebhook(body);
  const eventId = request.headers.get("x-razorpay-event-id") ?? "?";
  try {
    if (event.kind === "paid") {
      const result = await settlePaid({ providerOrderId: event.orderId, providerPaymentId: event.paymentId, amountPaise: event.amountPaise, currency: event.currency });
      if (result.status === "mismatch") console.error(`razorpay webhook ${eventId}: amount doesn't match order ${event.orderId}; not credited`);
      console.info(`razorpay webhook ${eventId}: paid ${event.orderId} -> ${result.status}`);
    } else if (event.kind === "failed") {
      await settleFailed(event.orderId);
      console.info(`razorpay webhook ${eventId}: failed ${event.orderId}`);
    } else if (event.kind === "refunded") {
      const result = await settleRefunded({ providerPaymentId: event.paymentId, amountPaise: event.amountPaise, refundedPaise: event.refundedPaise });
      console.info(`razorpay webhook ${eventId}: refund ${event.paymentId} -> ${result.status}`);
    } else {
      console.info(`razorpay webhook ${eventId}: ignored ${event.event}`);
    }
  } catch (error) {
    console.error(`razorpay webhook ${eventId}: failed to handle, Razorpay will retry`, error);
    return new Response("Try again.", { status: 500 });
  }
  return Response.json({ ok: true });
}
