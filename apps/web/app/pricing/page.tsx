import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL, LegalPage } from "@/components/landing/legal-page";
import { BOOST_VOTES } from "@/lib/queue/boost";
import { formatRupees, PACKS } from "@/lib/payments/packs";

export const metadata: Metadata = { title: "Pricing and delivery · Moozer" };

export default function PricingPage() {
  return (
    <LegalPage title="Pricing and delivery" updated="17 October 2026">
      <p>
        Moozer is free to use: start or join spaces, add songs and vote as much as you like. The only thing you can buy is boosts.
      </p>

      <h2>Boosts</h2>
      <p>
        A boost adds +{BOOST_VOTES} votes to a song in the queue. Everyone gets one free boost, which comes back 5.5 hours after it&apos;s used.
        If you want more, you can buy them:
      </p>
      <ul>
        {PACKS.map((pack) => (
          <li key={pack.id}>
            <strong>
              {pack.boosts} {pack.boosts === 1 ? "boost" : "boosts"}: {formatRupees(pack.amountPaise)}
            </strong>
          </li>
        ))}
      </ul>
      <p>
        Prices are in Indian rupees. Each purchase is a one-time payment, not a subscription. Bought boosts stay in your account, work in any
        space and never expire.
      </p>

      <h2>Paying</h2>
      <p>
        Payments are handled by Razorpay (cards, netbanking, wallets and UPI where available). Moozer never sees or stores your card, bank or
        UPI details.
      </p>

      <h2>Delivery</h2>
      <p>
        Boosts are digital, so nothing is shipped. They&apos;re added to your account as soon as your payment is confirmed, usually within
        seconds and at most a few minutes. You&apos;ll see them next to &ldquo;Get boosts&rdquo; in any space and on your Account page.
      </p>
      <p>
        If your payment went through but your boosts haven&apos;t arrived after 30 minutes, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
        with the payment ID from Razorpay&apos;s receipt. See <Link href="/refunds">Refunds and cancellation</Link> for what happens next.
      </p>
    </LegalPage>
  );
}
