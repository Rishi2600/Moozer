"use client";

import { Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { FormError } from "@/components/auth/form-error";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

// Password accounts confirm with their password. Google/GitHub-only accounts
// need a sign-in from the last day (Better Auth's "fresh session" rule).
export function DeleteAccountCard({ hasPassword, sessionIsFresh }: { hasPassword: boolean; sessionIsFresh: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(!hasPassword && !sessionIsFresh);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = hasPassword ? String(new FormData(event.currentTarget).get("password")) : undefined;
    setPending(true);
    setError(null);
    const { error } = await authClient.deleteUser(password ? { password } : {});
    if (error) {
      setPending(false);
      if (error.code === "SESSION_EXPIRED") setNeedsSignIn(true);
      else setError(authErrorMessage(error, "Couldn't delete your account. Try again."));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function signInAgain() {
    await authClient.signOut();
    router.replace("/sign-in?next=/account");
  }

  return (
    <section className="flex flex-col gap-space-md rounded-[14px] border border-destructive/20 bg-destructive/5 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-1.5 text-label-md text-destructive">
          <TriangleAlert className="size-4" aria-hidden />
          Delete account
        </h2>
        <p className="text-body-md text-muted-foreground">
          This removes your spaces, the songs you added and your votes. It can&apos;t be undone.
        </p>
      </div>
      <Dialog onOpenChange={() => setError(null)}>
        <DialogTrigger asChild>
          <Button variant="destructive-outline" className="self-start">
            <Trash2 aria-hidden />
            Delete account
          </Button>
        </DialogTrigger>
        <DialogContent onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your spaces, the songs you added and your votes are removed for good.
            </DialogDescription>
          </DialogHeader>
          {needsSignIn ? (
            <>
              <p className="text-body-md text-foreground">For your safety, sign in again before deleting your account.</p>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button onClick={signInAgain}>Sign in again</Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
              {hasPassword && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="delete-password">Enter your password to confirm</Label>
                  <PasswordInput id="delete-password" name="password" autoComplete="current-password" required aria-invalid={error ? true : undefined} />
                </div>
              )}
              {error && <FormError>{error}</FormError>}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
                <Button type="submit" variant="destructive" disabled={pending}>
                  {pending ? "Deleting…" : "Delete account"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
