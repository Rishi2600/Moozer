"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/s/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} aria-live="polite">
      {copied ? <Check aria-hidden /> : <Link2 aria-hidden />}
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
