import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdminTabs } from "./AdminTabs";
import { TABS } from "./tabs";
import { HeaderSignOut } from "./SignOutButton";

export function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="min-h-svh">
      <header className="surface-walnut on-dark sticky top-0 z-40 border-b border-gold/30">
        <div className="mx-auto flex max-w-[84rem] items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <Link href="/admin" className="font-display text-[1.4rem] leading-none tracking-[0.04em] text-ivory">
            {name}
            <span className="ml-3 hidden font-display text-[1.05rem] italic text-gold-light sm:inline">dashboard</span>
          </Link>
          <div className="flex items-center gap-5 text-[0.98rem] text-wall-text/85">
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ivory">
              View gallery <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
            </a>
            <HeaderSignOut />
          </div>
        </div>
        <nav aria-label="Dashboard" className="mx-auto max-w-[84rem] overflow-x-auto px-5 sm:px-8">
          <Suspense
            fallback={
              <ul className="flex gap-7 whitespace-nowrap">
                {TABS.map((t) => (
                  <li key={t.href}>
                    <Link href={t.href} className="admin-tab">
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            }
          >
            <AdminTabs />
          </Suspense>
        </nav>
      </header>
      <div className="mx-auto max-w-[84rem] px-5 pt-10 pb-24 sm:px-8 sm:pt-14">{children}</div>
    </div>
  );
}
