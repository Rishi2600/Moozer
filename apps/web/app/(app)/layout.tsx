import { AppShell } from "@/components/app-shell/app-shell";
import { requireSession } from "@/lib/session";

// Pages under (app) still check the session themselves; this layout only
// needs the user for the sidebar.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireSession();
  return <AppShell user={{ name: user.name, email: user.email }}>{children}</AppShell>;
}
