import type { Metadata } from "next";

import { CONTACT_EMAIL, LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = { title: "Contact · Moozer" };

export default function ContactPage() {
  return (
    <LegalPage title="Contact" updated="17 October 2026">
      <p>
        Moozer is run by Moozer. For anything, including payments, boosts that didn&apos;t arrive, refunds, your data or deleting your
        account, email us:
      </p>
      <p className="text-headline-md">
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p>
        For a payment, include your account&apos;s email and the payment ID from Razorpay&apos;s receipt so we can find it quickly. We read
        every email and reply as soon as we can.
      </p>
    </LegalPage>
  );
}
