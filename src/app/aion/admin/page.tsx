"use client";

import { useEffect, useState } from "react";
import {
  ChatbotDrawer,
  ChatbotLauncher,
} from "@/features/admin/components/chatbot";
import { StatsCard } from "@/features/admin/components/stats-card";
import { formatCOP } from "@/features/admin/helpers";

type DashboardData = {
  salesToday: number;
  salesWeek: number;
  salesMonth: number;
  totalOrders: number;
  avgTicket: number;
  totalExpenses: number;
  profitEstimated: number;
  bestItem: { name: string; units: number } | null;
  salesByDay: { label: string; value: number }[];
  alerts: {
    lowStock: { name: string; stock: number }[];
    upcomingReservations: number;
    recentHighExpense: { description: string; amount: number } | null;
  };
};

const ALERTS_PER_PAGE = 4;

export default function AdminDashboardPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertPage, setAlertPage] = useState(0);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Error de servidor");
        return r.json() as Promise<DashboardData>;
      })
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-stone-400">
        Cargando dashboard…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-red-500">
        Error al cargar datos.
      </div>
    );
  }

  const maxDay = Math.max(...data.salesByDay.map((d) => d.value), 1);

  const alerts: { color: string; text: string }[] = [];
  data.alerts.lowStock.forEach((i) =>
    alerts.push({
      color: "bg-amber-50",
      text: `Bajo stock: ${i.name} (${i.stock} restantes)`,
    }),
  );
  if (data.alerts.recentHighExpense) {
    alerts.push({
      color: "bg-red-50",
      text: `Gasto reciente: ${data.alerts.recentHighExpense.description} (${formatCOP(data.alerts.recentHighExpense.amount)})`,
    });
  }
  if (data.alerts.upcomingReservations > 0) {
    alerts.push({
      color: "bg-emerald-50",
      text: `${data.alerts.upcomingReservations} reserva${data.alerts.upcomingReservations > 1 ? "s" : ""} en las próximas 24h`,
    });
  }
  if (alerts.length === 0) {
    alerts.push({ color: "bg-stone-50", text: "Sin alertas activas" });
  }

  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Ventas de hoy" value={formatCOP(data.salesToday)} />
        <StatsCard
          title="Ventas de la semana"
          value={formatCOP(data.salesWeek)}
        />
        <StatsCard title="Ventas del mes" value={formatCOP(data.salesMonth)} />
        <StatsCard title="Total de pedidos" value={String(data.totalOrders)} />
        <StatsCard title="Ticket promedio" value={formatCOP(data.avgTicket)} />
        <StatsCard
          title="Gasto total del periodo"
          value={formatCOP(data.totalExpenses)}
        />
        <StatsCard
          title="Ganancia estimada"
          value={formatCOP(data.profitEstimated)}
        />
        <StatsCard
          title="Plato más vendido"
          value={data.bestItem?.name ?? "Sin datos"}
          subtitle={
            data.bestItem ? `${data.bestItem.units} unidades` : undefined
          }
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--admin-border,#f1cfd4)] bg-white p-4">
          <h3 className="font-bold">Ventas por día</h3>
          {data.salesByDay.every((d) => d.value === 0) ? (
            <p className="mt-8 text-center text-sm text-stone-400">
              Sin ventas registradas esta semana
            </p>
          ) : (
            <div className="mt-3 flex h-48 items-end gap-2">
              {data.salesByDay.map((d) => (
                <div
                  key={d.label}
                  className="flex flex-1 flex-col items-center"
                >
                  <div
                    className="w-full rounded-t-md bg-[var(--admin-primary,#581c22)]"
                    style={{
                      height: `${(d.value / maxDay) * 100}%`,
                      minHeight: d.value > 0 ? "4px" : "0",
                    }}
                  />
                  <span className="mt-1 text-xs text-stone-500">{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-[var(--admin-border,#f1cfd4)] bg-white p-4">
          <h3 className="font-bold">Alertas operativas</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {alerts
              .slice(
                alertPage * ALERTS_PER_PAGE,
                (alertPage + 1) * ALERTS_PER_PAGE,
              )
              .map((a, i) => (
                <li key={i} className={`rounded-xl p-2 ${a.color}`}>
                  {a.text}
                </li>
              ))}
          </ul>
          {alerts.length > ALERTS_PER_PAGE && (
            <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
              <button
                onClick={() => setAlertPage((p) => Math.max(0, p - 1))}
                disabled={alertPage === 0}
                className="rounded-lg px-3 py-1 hover:bg-stone-100 disabled:opacity-30"
              >
                ← Anterior
              </button>
              <span>
                {alertPage + 1} / {Math.ceil(alerts.length / ALERTS_PER_PAGE)}
              </span>
              <button
                onClick={() =>
                  setAlertPage((p) =>
                    Math.min(
                      Math.ceil(alerts.length / ALERTS_PER_PAGE) - 1,
                      p + 1,
                    ),
                  )
                }
                disabled={
                  alertPage >= Math.ceil(alerts.length / ALERTS_PER_PAGE) - 1
                }
                className="rounded-lg px-3 py-1 hover:bg-stone-100 disabled:opacity-30"
              >
                Siguiente →
              </button>
            </div>
          )}
        </article>
      </section>

      <ChatbotLauncher onClick={() => setChatOpen(true)} />
      <ChatbotDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        contextData={{
          salesToday: formatCOP(data.salesToday),
          salesWeek: formatCOP(data.salesWeek),
          salesMonth: formatCOP(data.salesMonth),
          totalOrders: String(data.totalOrders),
          avgTicket: formatCOP(data.avgTicket),
          totalExpenses: formatCOP(data.totalExpenses),
          profitEstimated: formatCOP(data.profitEstimated),
          bestItem: data.bestItem
            ? `${data.bestItem.name} (${data.bestItem.units} unidades)`
            : "Sin datos",
          upcomingReservations: String(data.alerts.upcomingReservations),
          lowStockCount: String(data.alerts.lowStock.length),
          highExpense: data.alerts.recentHighExpense
            ? `${data.alerts.recentHighExpense.description}: ${formatCOP(data.alerts.recentHighExpense.amount)}`
            : "Sin gasto alto reciente",
        }}
      />
    </div>
  );
}
