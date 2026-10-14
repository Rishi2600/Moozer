import { LandingFooter } from "./sections";
import { LandingHeader } from "./landing-header";

export const CONTACT_EMAIL = "rishiraj6177@gmail.com";

// Shared layout for Privacy and Terms: readable prose column.
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <LandingHeader />
      <main className="mx-auto max-w-[720px] px-margin py-space-xl md:px-margin-desktop">
        <h1 className="text-headline-lg-mobile text-foreground md:text-headline-lg">{title}</h1>
        <p className="mt-2 text-body-sm text-muted-foreground">Last updated {updated}</p>
        <div className="mt-8 flex flex-col gap-4 text-body-lg text-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-6 [&_h2]:text-headline-md [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
          {children}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
