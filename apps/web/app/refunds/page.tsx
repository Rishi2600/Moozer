import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL, LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = { title: "Refunds and cancellation · Moozer" };

export default function RefundsPage() {
  return (
    <LegalPage title="Refunds and cancellation" updated="17 October 2026">
      <p>
        Boosts are delivered the moment a payment is confirmed (see <Link href="/pricing">Pricing and delivery</Link>), so most refunds are
        boosts going back into your account, not money.
      </p>

      <h2>Boosts you get back automatically</h2>
      <p>A boost you used comes back to your account, exactly as it was spent, when:</p>
      <ul>
        <li>you undo it within a minute;</li>
        <li>the song you boosted is removed from the queue, or the person who added it is removed from the space;</li>
        <li>you&apos;re removed from the space before the song plays;</li>
        <li>the host ends the space before the song plays;</li>
        <li>YouTube can&apos;t play the song and it&apos;s skipped as it starts.</li>
      </ul>
      <p>Once a boosted song starts playing, its boosts are used for good.</p>

      <h2>Money refunds</h2>
      <ul>
        <li>
          <strong>Purchases are final once the boosts are in your account.</strong> Because they&apos;re delivered instantly, a purchase
          can&apos;t be cancelled after payment.
        </li>
        <li>
          <strong>If you were charged but didn&apos;t get your boosts,</strong> email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
          with your account&apos;s email and the payment ID from Razorpay&apos;s receipt. We&apos;ll check and refund the full amount to the
          way you paid, within 5 to 7 working days.
        </li>
        <li>
          <strong>If money left your account but the payment failed,</strong> your bank or Razorpay reverses it by itself, usually within 5
          to 7 working days. Nothing was charged by Moozer.
        </li>
      </ul>

      <h2>Unused boosts</h2>
      <p>
        Bought boosts never expire. They can&apos;t be exchanged for money or moved to another account. Deleting your account removes any
        boosts left in it.
      </p>
    </LegalPage>
  );
}
