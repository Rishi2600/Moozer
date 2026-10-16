import type { Metadata } from "next";

import Link from "next/link";

import { CONTACT_EMAIL, LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = { title: "Terms · Moozer" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="17 October 2026">
      <p>
        These are the rules for using Moozer, run by Moozer. By creating an account or joining a space you agree to them. Questions?
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Your account</h2>
      <p>Keep your sign-in details to yourself; you&apos;re responsible for what happens under your account. One account per person keeps votes fair.</p>

      <h2>Hosting a space</h2>
      <ul>
        <li>The host controls the space: they can play, skip and remove songs, reset its link and end it.</li>
        <li>
          Moozer plays music from YouTube on the host&apos;s device. If you play music somewhere public, like a café, shop or event, you may
          need a public performance licence where you are. Getting one is the host&apos;s responsibility.
        </li>
      </ul>

      <h2>Songs and YouTube</h2>
      <p>
        Moozer doesn&apos;t host any music. Songs are YouTube videos, owned by their creators and shown through YouTube&apos;s player, so the{" "}
        <a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a> apply to them too.
      </p>

      <h2>Boosts and payments</h2>
      <ul>
        <li>A boost adds votes to a song. Everyone gets a free one that comes back 5.5 hours after it&apos;s used, and you can buy more.</li>
        <li>
          Prices are in Indian rupees and shown before you pay (see <Link href="/pricing">Pricing and delivery</Link>). Payments are handled by
          Razorpay; Moozer never sees your card, bank or UPI details.
        </li>
        <li>To buy boosts you must be 18 or older, or have permission from a parent or guardian.</li>
        <li>
          Boosts aren&apos;t money: they can&apos;t be exchanged for cash, sold or moved to another account. Bought boosts never expire, and
          deleting your account removes any you have left.
        </li>
        <li>Discount codes can be changed or withdrawn at any time and have no cash value.</li>
        <li>
          Refunds follow our <Link href="/refunds">Refunds and cancellation</Link> policy. If a payment is reversed or charged back after its
          boosts were added, those boosts are taken back.
        </li>
      </ul>

      <h2>Be decent</h2>
      <ul>
        <li>Don&apos;t add content that&apos;s illegal, hateful or meant to harass people.</li>
        <li>Don&apos;t try to break, overload or get around Moozer&apos;s limits, or vote with more than one account.</li>
      </ul>
      <p>We may remove content or close accounts that break these rules.</p>

      <h2>The service</h2>
      <p>
        Moozer is provided as it is, and we&apos;re still building it: features may change, and things may occasionally go wrong. We&apos;re not
        responsible for losses caused by using it, as far as the law allows.
      </p>

      <h2>Ending</h2>
      <p>You can stop using Moozer and delete your account at any time from the Account page.</p>

      <h2>Changes</h2>
      <p>If we change these terms, we&apos;ll update the date at the top. Big changes will be announced in the app.</p>
    </LegalPage>
  );
}
