"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminHeader } from "@/features/admin/components/admin-header";

const titles: Record<string, string> = {
  "/aion/admin": "Dashboard",
  "/aion/admin/pedidos": "Pedidos",
  "/aion/admin/inventario": "Inventario",
  "/aion/admin/gastos": "Gastos",
  "/aion/admin/cierre-caja": "Cierre de caja",
  "/aion/admin/empleados": "Empleados",
  "/aion/admin/mesas-reservas": "Mesas / Reservas",
  "/aion/admin/configuracion": "Configuración",
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = useMemo(() => titles[pathname] ?? "Admin", [pathname]);

  return (
    <div className="flex min-h-screen bg-[var(--admin-bg,#ffffff)] text-[var(--admin-text,#24131a)]">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-w-0 flex-1">
        <AdminHeader title={title} onMenuClick={() => setOpen(true)} />
        <main className="p-3 sm:p-4">{children}</main>
      </div>
    </div>
  );
}
