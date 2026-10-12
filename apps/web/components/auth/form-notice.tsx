import { CircleCheck } from "lucide-react";

// Confirmation banner, e.g. after a password reset.
export function FormNotice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="flex items-start gap-2 rounded-[10px] bg-success/10 px-3 py-2.5 text-label-sm text-success">
      <CircleCheck className="mt-px size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
