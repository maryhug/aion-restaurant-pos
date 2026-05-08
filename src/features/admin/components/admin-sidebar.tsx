"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAdminTenant } from "@/features/admin/tenant-context";

const items = [
  { href: "/aion/admin", label: "Dashboard", icon: "◧" },
  { href: "/aion/admin/pedidos", label: "Pedidos", icon: "◫" },
  { href: "/aion/admin/inventario", label: "Inventario", icon: "◩" },
  { href: "/aion/admin/gastos", label: "Gastos", icon: "◨" },
  { href: "/aion/admin/cierre-caja", label: "Cierre de caja", icon: "◎" },
  { href: "/aion/admin/empleados", label: "Empleados", icon: "◍" },
  { href: "/aion/admin/mesas-reservas", label: "Mesas / Reservas", icon: "▦" },
  { href: "/aion/admin/configuracion", label: "Configuración", icon: "⚙" },
];

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
      <aside className="hidden w-64 shrink-0 border-r border-black/10 bg-[var(--admin-sidebar-bg,#6b0024)] p-4 lg:block">
        <SidebarContent pathname={pathname} />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/35"
            onClick={onClose}
            aria-label="Cerrar menu"
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-black/10 bg-[var(--admin-sidebar-bg,#6b0024)] p-4 shadow-xl">
            <SidebarContent pathname={pathname} onNavigate={onClose} />
          </aside>
        </div>
      )}
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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/aion/login");
  }

  return (
    <div className="flex h-full flex-col">
      <p className="mb-1 text-lg font-black text-white">AION</p>
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-white/70">
        Admin panel
      </p>

      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-black/25 text-white"
                  : "text-white/85 hover:bg-white/10"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        <div className="rounded-xl bg-white/10 p-3 text-xs text-white/80 ring-1 ring-white/15">
          <p className="font-semibold text-white">{tenant.restaurantName}</p>
          {activeBranch && (
            <p className="mt-0.5 text-white/60">{activeBranch.name}</p>
          )}
          <p className="mt-1 text-white/40">
            Sesión aislada por restaurante/sede
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full rounded-xl bg-white/10 px-3 py-2 text-left text-xs font-semibold text-white/80 hover:bg-white/20"
        >
          Cerrar sesión →
        </button>
      </div>
    </div>
  );
}
