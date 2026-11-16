"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TABS } from "./tabs";

function isActive(href: string, p: string) {
  if (href === "/admin") return p === "/admin" || (p.startsWith("/admin/works/") && p !== "/admin/works/new");
  return p.startsWith(href);
}

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <ul className="flex gap-7 whitespace-nowrap">
      {TABS.map((t) => {
        const active = isActive(t.href, pathname);
        return (
          <li key={t.href}>
            <Link href={t.href} aria-current={active ? "page" : undefined} className="admin-tab">
              {t.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
