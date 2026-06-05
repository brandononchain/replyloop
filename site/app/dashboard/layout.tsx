import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { getUserOrgs } from "@/lib/api/orgs";
import SignOutButton from "./_components/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const orgs = await getUserOrgs();
  // If somehow a user has no org (shouldn't happen — handle_new_user trigger
  // auto-creates one — bounce them to a setup step)
  if (orgs.length === 0) {
    // Try to bootstrap one
    const supabase = await createSupabaseServerClient();
    await supabase.rpc("create_org_with_owner", {
      p_name: `${user.email?.split("@")[0] ?? "Personal"}'s workspace`,
      p_slug: `org-${user.id.slice(0, 8)}`,
    });
  }

  const activeOrg = orgs[0]?.organization;

  return (
    <div className="min-h-screen flex sans">
      <aside className="w-64 border-r border-[color:var(--border)] bg-[color:var(--bg-secondary)] flex flex-col">
        <div className="px-5 py-5 border-b border-[color:var(--border)]">
          <Link href="/" className="text-lg" style={{ fontFamily: "Newsreader, serif" }}>
            Replyloop
          </Link>
          {activeOrg && (
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)]">Workspace</div>
              <div className="text-sm truncate">{activeOrg.name}</div>
              <div className="text-[10px] text-[color:var(--text-muted)] mt-0.5">
                {activeOrg.plan} · {activeOrg.plan_status}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <NavLink href="/dashboard">Overview</NavLink>
          <NavLink href="/dashboard/keys">API keys</NavLink>
          <NavLink href="/dashboard/connections">Connections</NavLink>
          <NavLink href="/dashboard/team">Team</NavLink>
          <NavLink href="/dashboard/billing">Billing</NavLink>
          <NavLink href="/dashboard/settings">Settings</NavLink>
        </nav>

        <div className="px-3 py-4 border-t border-[color:var(--border)]">
          <div className="text-xs text-[color:var(--text-muted)] truncate mb-2">{user.email}</div>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 px-10 py-10 overflow-y-auto">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-3 py-1.5 rounded hover:bg-[color:var(--bg-elevated)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
    >
      {children}
    </Link>
  );
}
