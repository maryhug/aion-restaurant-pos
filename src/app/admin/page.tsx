"use client";

import { useMemo, useState } from "react";
import {
  ChatbotDrawer,
  ChatbotLauncher,
} from "@/features/admin/components/chatbot";
import { StatsCard } from "@/features/admin/components/stats-card";
import { salesByDayMock, salesByMonthMock } from "@/features/admin/mocks";
import { formatCOP } from "@/features/admin/helpers";

export default function AdminDashboardPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const totalToday = salesByDayMock[salesByDayMock.length - 1]?.value ?? 0;
  const totalWeek = useMemo(
    () => salesByDayMock.reduce((s, p) => s + p.value, 0),
    [],
  );
  const totalMonth = salesByMonthMock[salesByMonthMock.length - 1]?.value ?? 0;
  const maxDay = Math.max(...salesByDayMock.map((p) => p.value), 1);

  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Ventas de hoy" value={formatCOP(totalToday)} />
        <StatsCard title="Ventas de la semana" value={formatCOP(totalWeek)} />
        <StatsCard title="Ventas del mes" value={formatCOP(totalMonth)} />
        <StatsCard title="Total de pedidos" value="342" />
        <StatsCard title="Ticket promedio" value={formatCOP(58200)} />
        <StatsCard title="Gasto total del periodo" value={formatCOP(9300000)} />
        <StatsCard title="Ganancia estimada" value={formatCOP(12450000)} />
        <StatsCard
          title="Plato más vendido"
          value="Latte Avellana"
          subtitle="96 unidades"
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--admin-border,#f1cfd4)] bg-white p-4">
          <h3 className="font-bold">Ventas por día</h3>
          <div className="mt-3 flex h-48 items-end gap-2">
            {salesByDayMock.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t-md bg-[var(--admin-primary,#581c22)]"
                  style={{ height: `${(d.value / maxDay) * 100}%` }}
                />
                <span className="mt-1 text-xs text-stone-500">{d.label}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-[var(--admin-border,#f1cfd4)] bg-white p-4">
          <h3 className="font-bold">Alertas operativas</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="rounded-xl bg-amber-50 p-2">
              Bajo stock: Cafe premium (8kg)
            </li>
            <li className="rounded-xl bg-red-50 p-2">
              Gasto alto reciente: Reparacion molino
            </li>
            <li className="rounded-xl bg-blue-50 p-2">
              Diferencia en cierre de caja: -$40.000
            </li>
            <li className="rounded-xl bg-violet-50 p-2">
              2 empleados pendientes de pago
            </li>
            <li className="rounded-xl bg-emerald-50 p-2">
              5 reservas próximas en 24h
            </li>
          </ul>
        </article>
      </section>
      <ChatbotLauncher onClick={() => setChatOpen(true)} />
      <ChatbotDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
