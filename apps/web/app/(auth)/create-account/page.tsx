import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthHeading, AuthShell, OrDivider } from "@/components/auth/auth-shell";
import { SocialButtons } from "@/components/auth/social-buttons";
import { safeNext } from "@/lib/safe-next";
import { getSession } from "@/lib/session";

import { CreateAccountForm } from "./create-account-form";

export const metadata: Metadata = { title: "Create account · Moozer" };

export default async function CreateAccountPage(props: PageProps<"/create-account">) {
  const { next } = await props.searchParams;
  const destination = safeNext(next);
  if (await getSession()) redirect(destination);

  const signInHref = next ? `/sign-in?next=${encodeURIComponent(destination)}` : "/sign-in";

  return (
    <AuthShell>
      <AuthHeading
        title="Create your account"
        description="You'll be able to start spaces and vote in any space you join."
      />
      <SocialButtons next={destination} />
      <OrDivider />
      <CreateAccountForm next={destination} />
      <p className="mt-6 text-center text-body-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={signInHref} className="font-semibold text-orange-deep hover:text-orange-electric">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
