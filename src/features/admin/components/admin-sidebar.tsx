"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAdminTenant } from "@/features/admin/tenant-context";
import {
  LayoutDashboardIcon,
  ShoppingBagIcon,
  PackageIcon,
  ReceiptIcon,
  BanknotesIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  UsersIcon,
  CogIcon,
  LogOutIcon,
  BuildingStorefrontIcon,
} from "@/features/admin/components/icons";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
};

function getNavItems(): NavItem[] {
  const base = "/aion/admin";
  return [
    {
      href: base,
      label: "Dashboard",
      icon: <LayoutDashboardIcon className="h-5 w-5" />,
      exact: true,
    },
    {
      href: `${base}/pedidos`,
      label: "Pedidos",
      icon: <ShoppingBagIcon className="h-5 w-5" />,
    },
    {
      href: `${base}/inventario`,
      label: "Inventario",
      icon: <PackageIcon className="h-5 w-5" />,
    },
    {
      href: `${base}/gastos`,
      label: "Gastos",
      icon: <ReceiptIcon className="h-5 w-5" />,
    },
    {
      href: `${base}/cierre-caja`,
      label: "Cierre de caja",
      icon: <BanknotesIcon className="h-5 w-5" />,
    },
    {
      href: `${base}/empleados`,
      label: "Empleados",
      icon: <UserGroupIcon className="h-5 w-5" />,
    },
    {
      href: `${base}/mesas-reservas`,
      label: "Mesas / Reservas",
      icon: <CalendarDaysIcon className="h-5 w-5" />,
    },
    {
      href: `${base}/clientes`,
      label: "Clientes",
      icon: <UsersIcon className="h-5 w-5" />,
    },
    {
      href: `${base}/configuracion`,
      label: "Configuración",
      icon: <CogIcon className="h-5 w-5" />,
    },
  ];
}

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/10 bg-[var(--admin-sidebar-bg,#581c22)] lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile / tablet drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-[var(--admin-sidebar-bg,#581c22)] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent pathname={pathname} onNavigate={onClose} />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { tenant, branchId } = useAdminTenant();
  const router = useRouter();
  const activeBranch = tenant.branches.find((b) => b.id === branchId);
  const items = getNavItems();
  const initial = tenant.restaurantName.charAt(0).toUpperCase();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/aion/login");
  }

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return (
      pathname === (item.href as string) ||
      pathname.startsWith((item.href as string) + "/")
    );
  }

  return (
    <div className="admin-scrollbar flex h-full flex-col overflow-y-auto">
      {/* Restaurant header */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-5">
        {tenant.branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tenant.branding.logoUrl}
            alt={tenant.restaurantName}
            className="h-8 w-8 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {tenant.restaurantName}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Admin panel
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pb-2">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href as string}
              href={item.href as string}
              onClick={onNavigate}
              className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Separator */}
      <div className="mx-4 my-3 border-t border-white/10" />

      {/* Branch + logout */}
      <div className="space-y-1 px-2 pb-2">
        {activeBranch && (
          <div className="mx-1 rounded-xl bg-white/8 p-3">
            <div className="flex items-start gap-2">
              <BuildingStorefrontIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/50" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white/90">
                  {activeBranch.name}
                </p>
                <p className="text-[10px] text-white/50">Sede activa</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white/90"
        >
          <LogOutIcon className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>

      {/* Footer */}
      <p className="py-3 text-center text-[10px] text-white/25">© AION</p>
    </div>
  );
}
