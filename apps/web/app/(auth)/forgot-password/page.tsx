import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset your password · Moozer" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-body-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-semibold text-orange-deep hover:text-orange-electric">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
