"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/provider";

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const t = useT();
  const links = [
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/incidents", label: t.nav.incidents },
    ...(isAdmin ? [{ href: "/users", label: t.nav.users }] : []),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-shell-line bg-shell pb-[env(safe-area-inset-bottom)] sm:static sm:h-full sm:items-stretch sm:gap-1 sm:border-0 sm:pb-0">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-14 flex-1 items-center justify-center px-2 font-display text-sm font-semibold tracking-[0.06em] uppercase transition-colors sm:h-auto sm:flex-none sm:px-3 sm:text-[0.9375rem] ${
              active ? "text-shell-ink" : "text-shell-muted hover:text-shell-ink"
            }`}
          >
            {label}
            <span
              aria-hidden
              className={`absolute inset-x-2 top-0 h-0.75 bg-yellow transition-transform duration-200 ease-out sm:top-auto sm:bottom-0 sm:inset-x-3 ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
