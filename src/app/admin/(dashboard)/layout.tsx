import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { getAdminState } from "@/lib/admin-data";
import { getSiteSettings } from "@/lib/data";

export default async function DashboardLayout({ children }: LayoutProps<"/admin">) {
  const settings = await getSiteSettings();
  return (
    <AdminShell name={settings.artist_name}>
      <Suspense fallback={<Waiting />}>
        <RequireAdmin>{children}</RequireAdmin>
      </Suspense>
    </AdminShell>
  );
}

/** Every dashboard page renders inside this check. Server Actions repeat it, and RLS enforces it in the database. */
async function RequireAdmin({ children }: { children: React.ReactNode }) {
  const state = await getAdminState();
  if (state.status === "unconfigured") {
    return (
      <Message title="Connect Supabase first">
        The dashboard needs a Supabase project. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to your environment variables, run the database migration, then reload.
        The README walks through each step.
      </Message>
    );
  }
  if (state.status === "unavailable") {
    return (
      <Message title="Couldn't reach the gallery's database">
        This is usually a brief connection problem. Wait a few seconds and refresh the page.
      </Message>
    );
  }
  if (state.status === "signed-out") redirect("/admin/login");
  if (state.status === "not-admin") {
    return (
      <Message title="This account can't manage the gallery">
        You&rsquo;re signed in as {state.email ?? "an unknown user"}, which isn&rsquo;t on the list of administrators. To grant access, run{" "}
        <code>supabase/make-admin.sql</code> in the Supabase SQL Editor with this email address.
        <div className="mt-6">
          <SignOutButton />
        </div>
      </Message>
    );
  }
  return <>{children}</>;
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-[40rem]">
      <h1 className="font-display text-[2.4rem] leading-tight font-light text-ink">{title}</h1>
      <div className="mt-4 text-[1.08rem] leading-relaxed text-umber [&_code]:rounded-sm [&_code]:bg-linen [&_code]:px-1.5 [&_code]:text-[0.92em]">
        {children}
      </div>
    </div>
  );
}

function Waiting() {
  return <p className="font-display text-[1.3rem] italic text-umber">Opening the dashboard…</p>;
}
