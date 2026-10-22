import { LogOut } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { LanguageSwitch } from "@/components/language-switch";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";
import { RoleTag } from "./badges";
import { Mark } from "./mark";
import { NavLinks } from "./nav-links";

export async function AppHeader() {
  return (
    <header className="sticky top-0 z-20 bg-shell text-shell-ink">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:gap-8 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-shell-ink">
          <Mark />
          <span className="hidden font-display text-lg font-bold tracking-[0.06em] uppercase sm:inline">
            SupplyGuard
          </span>
        </Link>
        <UserArea />
      </div>
    </header>
  );
}

async function UserArea() {
  const [user, t] = await Promise.all([getCurrentUser(), getDict()]);
  return (
    <>
      <NavLinks isAdmin={hasRole(user, "admin")} />
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <LanguageSwitch />
        <div className="hidden items-center gap-2 md:flex">
          <span className="text-shell-ink">{user.full_name}</span>
          <RoleTag role={user.role} />
        </div>
        <form action={logout}>
          <button
            type="submit"
            aria-label={t.common.signOut}
            title={t.common.signOut}
            className="pressable flex size-9 items-center justify-center rounded-sm text-shell-muted hover:bg-shell-raised hover:text-shell-ink pointer-coarse:size-11"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </form>
      </div>
    </>
  );
}
