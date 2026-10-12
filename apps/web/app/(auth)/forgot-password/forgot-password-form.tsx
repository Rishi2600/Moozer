"use client";

import { useState, type FormEvent } from "react";

import { AuthHeading } from "@/components/auth/auth-shell";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setPending(true);
    setError(null);
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setPending(false);
    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    setSentTo(email);
  }

  if (sentTo) {
    // Same answer whether or not the account exists, so emails can't be probed.
    return (
      <AuthHeading
        title="Check your email"
        description={`If there's a Moozer account for ${sentTo}, we've sent it a link to set a new password. The link works for 1 hour.`}
      />
    );
  }

  return (
    <>
      <AuthHeading
        title="Reset your password"
        description="Enter your email and we'll send you a link to set a new one."
      />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required variant="filled" />
        </div>
        {error && <FormError>{error}</FormError>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending link…" : "Send reset link"}
        </Button>
      </form>
    </>
  );
}
