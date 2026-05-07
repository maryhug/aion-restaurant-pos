"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard", icon: "◧" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "◫" },
  { href: "/admin/inventario", label: "Inventario", icon: "◩" },
  { href: "/admin/gastos", label: "Gastos", icon: "◨" },
  { href: "/admin/cierre-caja", label: "Cierre de caja", icon: "◎" },
  { href: "/admin/empleados", label: "Empleados", icon: "◍" },
  { href: "/admin/mesas-reservas", label: "Mesas/Reservas", icon: "▦" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙" },
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
      <aside className="hidden w-72 shrink-0 border-r border-black/10 bg-[var(--admin-sidebar-bg,#6b0024)] p-4 lg:block">
        <SidebarContent pathname={pathname} />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/35"
            onClick={onClose}
            aria-label="Cerrar menu"
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-black/10 bg-[var(--admin-sidebar-bg,#6b0024)] p-4 shadow-xl">
            <SidebarContent pathname={pathname} onNavigate={onClose} />
          </aside>
        </div>
      ) : null}
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
      <p className="mt-auto rounded-xl bg-white/10 p-3 text-xs text-white/80 ring-1 ring-white/15">
        Tenant-safe UI: cada sesión carga branding y datos aislados por
        restaurante/sede.
      </p>
    </div>
  );
}
