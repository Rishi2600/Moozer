"use client";

import { Plus, Tag, X, Zap } from "lucide-react";
import { useCallback, useId, useState, useTransition } from "react";

import { confirmPurchaseAction, priceAction, redeemAction, startPurchaseAction } from "@/app/(app)/boosts/actions";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { BOOST_VOTES } from "@/lib/queue/boost";
import { loadCheckout, openCheckout } from "@/lib/payments/checkout";
import { formatRupees, PACKS, type PackId } from "@/lib/payments/packs";

type Applied = { code: string; amountPaise: number; discountPaise: number };

// Pick 1, 3 or 10 boosts; a code can take money off (a 100% code makes it
// free, with no payment at all). Paying opens Razorpay Checkout.
export function GetBoostsDialog({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [packId, setPackId] = useState<PackId>("trio");
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<Applied | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const codeId = useId();
  const dismiss = useCallback(() => setDone(null), []);
  const pack = PACKS.find((p) => p.id === packId)!;
  const total = applied ? applied.amountPaise : pack.amountPaise;

  function reset() {
    setCode("");
    setApplied(null);
    setCodeOpen(false);
    setError(null);
  }

  function price(nextPack: PackId, nextCode: string) {
    setError(null);
    start(async () => {
      const result = await priceAction(nextPack, nextCode);
      if (result.ok && result.code) setApplied({ code: result.code, amountPaise: result.amountPaise, discountPaise: result.discountPaise });
      else {
        setApplied(null);
        if (!result.ok) setError(result.error);
      }
    });
  }

  function choose(next: PackId) {
    setPackId(next);
    if (applied) price(next, applied.code); // the discount depends on the option
  }

  function getFree() {
    if (!applied) return;
    setError(null);
    start(async () => {
      const result = await redeemAction(packId, applied.code);
      if (!result.ok) return setError(result.error);
      setOpen(false);
      reset();
      setDone(`${result.boosts} ${result.boosts === 1 ? "boost" : "boosts"} added`);
    });
  }

  function pay() {
    setError(null);
    start(async () => {
      const started = await startPurchaseAction(packId, applied?.code);
      if (!started.ok) return setError(started.error);
      try {
        await loadCheckout();
      } catch {
        return setError("Couldn't open the payment window. Check your connection and try again.");
      }
      // Our dialog closes first: its focus lock would block clicks in Razorpay's window.
      setOpen(false);
      reset();
      const label = `${started.boosts} ${started.boosts === 1 ? "boost" : "boosts"}`;
      openCheckout({
        key: started.keyId,
        order_id: started.orderId,
        amount: started.amountPaise,
        currency: "INR",
        name: "Moozer",
        description: label,
        prefill: { name: started.name, email: started.email },
        theme: { color: "#ff6200" },
        handler: (response) => {
          setDone("Payment received. Adding your boosts…");
          void confirmPurchaseAction(response).then((confirmed) => setDone(confirmed.ok ? `${label} added` : confirmed.error));
        },
        modal: { ondismiss: () => setDone("Payment closed. Nothing was charged.") },
      });
    });
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="link" size="sm" className="h-auto px-0" aria-label={compact ? "Get boosts" : undefined}>
            <Plus aria-hidden />
            {compact ? <span className="max-sm:sr-only">Get boosts</span> : "Get boosts"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Get boosts</DialogTitle>
            <DialogDescription>
              Each boost adds +{BOOST_VOTES} votes to a song. They stay in your account, work in any space and never expire.
            </DialogDescription>
          </DialogHeader>

          <fieldset className="flex flex-col gap-2" disabled={pending}>
            <legend className="sr-only">How many boosts</legend>
            {PACKS.map((option) => (
              <label key={option.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="pack"
                  value={option.id}
                  checked={packId === option.id}
                  onChange={() => choose(option.id)}
                  className="peer sr-only"
                />
                <span className="flex items-center gap-3 rounded-xl border-[1.5px] border-border bg-card px-4 py-3 transition-colors peer-checked:border-primary peer-checked:bg-cream-subtle peer-focus-visible:ring-3 peer-focus-visible:ring-primary/30 hover:border-border-strong">
                  <Zap className="size-4 shrink-0 fill-amber-bright text-amber-bright" aria-hidden />
                  <span className="flex flex-1 flex-col">
                    <span className="text-label-md text-foreground">
                      {option.boosts} {option.boosts === 1 ? "boost" : "boosts"}
                    </span>
                    {option.boosts > 1 && (
                      <span className="text-body-sm text-muted-foreground">about {formatRupees(Math.round(option.amountPaise / option.boosts / 100) * 100)} each</span>
                    )}
                  </span>
                  <span className="text-title-sm text-foreground tabular-nums">{formatRupees(option.amountPaise)}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {applied ? (
            <p className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-body-sm text-foreground">
              <Tag className="size-4 shrink-0 text-success" aria-hidden />
              <span className="flex-1">
                <span className="font-semibold">{applied.code}</span> applied: −{formatRupees(applied.discountPaise)}
              </span>
              <button type="button" onClick={reset} aria-label="Remove the code" className="text-muted-foreground hover:text-foreground">
                <X className="size-4" aria-hidden />
              </button>
            </p>
          ) : codeOpen ? (
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (code.trim()) price(packId, code);
              }}
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor={codeId} className="text-label-md text-foreground">Code</label>
                <Input id={codeId} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" autoCapitalize="characters" autoFocus className="uppercase" />
              </div>
              <Button type="submit" variant="outline" disabled={pending || !code.trim()}>Apply</Button>
            </form>
          ) : (
            <button type="button" onClick={() => setCodeOpen(true)} className="w-fit text-label-md text-primary underline-offset-4 hover:underline">
              Have a code?
            </button>
          )}

          {error && <FormError>{error}</FormError>}

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <p className="flex items-baseline justify-between text-body-md text-muted-foreground">
              Total
              <span className="text-title-sm text-foreground tabular-nums">{formatRupees(total)}</span>
            </p>
            {total === 0 ? (
              <Button size="lg" onClick={getFree} disabled={pending}>
                {pending ? "Adding…" : `Get ${pack.boosts} ${pack.boosts === 1 ? "boost" : "boosts"} free`}
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={pay} disabled={pending}>
                  {pending ? "Opening…" : `Pay ${formatRupees(total)}`}
                </Button>
                <p className="text-center text-body-sm text-muted-foreground">UPI, cards, netbanking and wallets, through Razorpay.</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {done && <Toast message={done} onDismiss={dismiss} />}
    </>
  );
}
