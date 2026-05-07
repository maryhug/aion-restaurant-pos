"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminHeader } from "@/features/admin/components/admin-header";
import type { DatePreset } from "@/features/admin/types";

const titles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/pedidos": "Pedidos",
  "/admin/inventario": "Inventario",
  "/admin/gastos": "Gastos",
  "/admin/cierre-caja": "Cierre de caja",
  "/admin/empleados": "Empleados",
  "/admin/mesas-reservas": "Mesas/Reservas",
  "/admin/configuracion": "Configuración",
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const title = useMemo(() => titles[pathname] ?? "Admin", [pathname]);

  return (
    <div className="flex min-h-screen bg-[var(--admin-bg,#ffffff)] text-[var(--admin-text,#24131a)]">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-w-0 flex-1">
        <AdminHeader
          title={title}
          datePreset={datePreset}
          onDatePresetChange={setDatePreset}
          onMenuClick={() => setOpen(true)}
        />
        <main className="p-3 sm:p-4">{children}</main>
      </div>
    </div>
  );
}
