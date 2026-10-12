"use client";

import { Check, CheckCheck, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { FormError } from "@/components/auth/form-error";
import { Avatar } from "@/components/avatar";
import { GitHubIcon, GoogleIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

const PROVIDER_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  google: { label: "Signed in with Google", icon: <GoogleIcon className="size-3.5" /> },
  github: { label: "Signed in with GitHub", icon: <GitHubIcon className="size-3.5" /> },
  credential: { label: "Signed in with email and password", icon: <Mail className="size-3.5" aria-hidden /> },
};

export function ProfileCard({ name, email, providers }: { name: string; email: string; providers: string[] }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [saved, setSaved] = useState(name);
  const [pending, setPending] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim();
  const changed = trimmed !== saved && trimmed.length > 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!changed) return;
    setPending(true);
    setError(null);
    const { error } = await authClient.updateUser({ name: trimmed });
    setPending(false);
    if (error) {
      setError(authErrorMessage(error, "Couldn't save your name. Try again."));
      return;
    }
    setSaved(trimmed);
    setValue(trimmed);
    setJustSaved(true);
    router.refresh(); // update the name in the sidebar
  }

  return (
    <Card className="flex flex-col gap-space-lg rounded-[14px] p-5">
      <h2 className="text-label-md text-foreground">Profile</h2>
      <div className="flex items-center gap-space-md rounded-xl bg-cream-subtle p-space-sm">
        <Avatar name={saved} className="size-12 text-counter-ballot" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-title-sm text-foreground">{saved}</span>
          <span className="truncate text-body-sm text-muted-foreground">{email}</span>
        </div>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name" className="text-foreground">Name</Label>
          <Input
            id="profile-name"
            value={value}
            maxLength={80}
            autoComplete="name"
            onChange={(event) => {
              setValue(event.target.value);
              setJustSaved(false);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="profile-email" className="text-foreground">Email</Label>
            <span className="flex items-center gap-1 text-body-sm text-faint-foreground">
              <Lock className="size-3.5" aria-hidden />
              Can&apos;t be changed yet
            </span>
          </div>
          <Input id="profile-email" value={email} readOnly className="cursor-not-allowed border-transparent bg-cream-subtle text-muted-foreground" />
          <ul className="flex flex-col gap-1 pt-0.5">
            {providers.map((id) => {
              const provider = PROVIDER_LABELS[id];
              return provider ? (
                <li key={id} className="flex items-center gap-1.5 text-body-sm text-faint-foreground">
                  {provider.icon}
                  {provider.label}
                </li>
              ) : null;
            })}
          </ul>
        </div>
        {error && <FormError>{error}</FormError>}
        <div className="flex items-center gap-space-md pt-space-xs">
          <Button type="submit" disabled={!changed || pending}>
            <Check aria-hidden />
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {justSaved && (
            <span role="status" className="flex items-center gap-1 text-body-sm text-success">
              <CheckCheck className="size-3.5" aria-hidden />
              Saved
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
