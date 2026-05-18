"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminHeader } from "@/features/admin/components/admin-header";
import { AdminRightPanel } from "@/features/admin/components/admin-right-panel";

const titles: Record<string, string> = {
  "/aion/admin": "Dashboard",
  "/aion/admin/pedidos": "Pedidos",
  "/aion/admin/inventario": "Inventario",
  "/aion/admin/gastos": "Gastos",
  "/aion/admin/cierre-caja": "Cierre de caja",
  "/aion/admin/empleados": "Empleados",
  "/aion/admin/mesas-reservas": "Mesas / Reservas",
  "/aion/admin/clientes": "Clientes",
  "/aion/admin/configuracion": "Configuración",
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = useMemo(() => titles[pathname] ?? "Admin", [pathname]);

  return (
    <div className="admin-panel flex min-h-screen bg-[var(--admin-bg,#fafafa)] text-[var(--admin-text,#24131a)]">
      {/* Left sidebar */}
      <AdminSidebar open={open} onClose={() => setOpen(false)} />

      {/* Main content column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <AdminHeader title={title} onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>

      {/* Right panel — visible only on xl+ */}
      <AdminRightPanel />
    </div>
  );
}
