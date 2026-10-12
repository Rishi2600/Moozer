import { Check, Circle } from "lucide-react";

import { PASSWORD_RULES } from "@/lib/password-rules";
import { cn } from "@/lib/utils";

// Live list of the four password rules: met rules turn green with a filled check.
export function PasswordChecklist({ password, id }: { password: string; id?: string }) {
  return (
    <ul id={id} className="mt-2 flex flex-col gap-1.5" aria-label="Password rules">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.id}
            className={cn("flex items-center gap-2 text-label-sm", met ? "text-success" : "text-muted-foreground")}
          >
            {met ? (
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-success text-white">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
            ) : (
              <Circle className="size-4 shrink-0 text-faint-foreground" aria-hidden />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{met ? " (done)" : " (not yet)"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
