"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCog,
  LogOut,
  Leaf,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigationItems: NavItem[] = [
  {
    label: "Projetos",
    href: "/projetos",
    icon: FolderKanban,
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
  },
];

const adminNavigationItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    label: "Usuários",
    href: "/usuarios",
    icon: UserCog,
    adminOnly: true,
  },
];

interface SidebarProps {
  userRole: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[260px] flex-col border-r border-border bg-surface transition-all duration-300">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-text-primary">
            Gestão Agro
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-text-tertiary">
            Sistema
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {/* Admin Section */}
        {userRole === "ADMIN" && (
          <div className="mb-4">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Administração
            </p>
            {adminNavigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] flex-shrink-0 transition-colors duration-200 ${
                      active
                        ? "text-brand-600"
                        : "text-text-tertiary group-hover:text-text-secondary"
                    }`}
                  />
                  {item.label}
                  {active && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Main Navigation */}
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            Menu Principal
          </p>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] flex-shrink-0 transition-colors duration-200 ${
                    active
                      ? "text-brand-600"
                      : "text-text-tertiary group-hover:text-text-secondary"
                  }`}
                />
                {item.label}
                {active && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0 text-text-tertiary transition-colors duration-200 group-hover:text-red-500" />
          Sair
        </button>
      </div>
    </aside>
  );
}
