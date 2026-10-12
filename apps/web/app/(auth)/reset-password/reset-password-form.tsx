"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { FormError } from "@/components/auth/form-error";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { meetsPasswordRules } from "@/lib/password-rules";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!meetsPasswordRules(password)) {
      setError("Your password needs to meet all four rules above.");
      return;
    }
    setPending(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) {
      setPending(false);
      setError(authErrorMessage(error));
      return;
    }
    // Resetting signs out every device, so sign in again with the new password.
    router.replace("/sign-in?reset=done");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="password-rules"
        />
        <PasswordChecklist id="password-rules" password={password} />
      </div>
      {error && <FormError>{error}</FormError>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
