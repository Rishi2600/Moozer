"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export function SessionCard({ device }: { device: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-space-md rounded-[14px] p-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="text-label-md text-foreground">Session</h2>
        <p className="text-body-md text-muted-foreground">Sign out of your account on this browser.</p>
        <p className="mt-1 flex items-center gap-2 text-body-sm text-success">
          <span className="size-2 rounded-full bg-success" aria-hidden />
          Current session ({device})
        </p>
      </div>
      <Button variant="outline" onClick={signOut} disabled={pending} className="self-start sm:self-auto">
        <LogOut aria-hidden />
        {pending ? "Signing out…" : "Sign out"}
      </Button>
    </Card>
  );
}
