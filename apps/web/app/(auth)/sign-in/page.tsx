import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthHeading, AuthShell, OrDivider } from "@/components/auth/auth-shell";
import { FormError } from "@/components/auth/form-error";
import { SocialButtons } from "@/components/auth/social-buttons";
import { oauthErrorMessage } from "@/lib/auth-errors";
import { safeNext } from "@/lib/safe-next";
import { getSession } from "@/lib/session";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Moozer" };

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const { next, error } = await props.searchParams;
  const destination = safeNext(next);
  if (await getSession()) redirect(destination);

  const createAccountHref = next ? `/create-account?next=${encodeURIComponent(destination)}` : "/create-account";

  return (
    <AuthShell>
      <AuthHeading title="Sign in to Moozer" description="Sign in to start a space or vote in one." />
      {typeof error === "string" && (
        <div className="mb-4">
          <FormError>{oauthErrorMessage(error)}</FormError>
        </div>
      )}
      <SocialButtons next={destination} />
      <OrDivider />
      <SignInForm next={destination} />
      <p className="mt-6 text-center text-body-sm text-muted-foreground">
        New to Moozer?{" "}
        <Link href={createAccountHref} className="font-semibold text-orange-deep hover:text-orange-electric">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
