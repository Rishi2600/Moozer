import type { Metadata } from "next";
import Link from "next/link";

import { AuthHeading, AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set a new password · Moozer" };

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const { token, error } = await props.searchParams;

  // Better Auth sends people here with ?error=INVALID_TOKEN when a link is stale.
  if (typeof token !== "string" || error) {
    return (
      <AuthShell>
        <AuthHeading
          title="This link has expired"
          description="Reset links work once, for 1 hour. Ask for a new one and use the latest email."
        />
        <Button asChild className="w-full">
          <Link href="/forgot-password">Ask for a new link</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeading title="Set a new password" description="Choose a new password for your Moozer account." />
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
