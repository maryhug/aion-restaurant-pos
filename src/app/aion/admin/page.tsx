"use client";

import { useEffect, useState } from "react";
import {
  ChatbotDrawer,
  ChatbotLauncher,
} from "@/features/admin/components/chatbot";
import { formatCOP } from "@/features/admin/helpers";
import {
  BanknotesIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  ShoppingBagIcon,
  ReceiptIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  StarIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  ChevronRightIcon,
} from "@/features/admin/components/icons";
import type { ReactNode } from "react";

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

type Alert = {
  bg: string;
  border: string;
  icon: ReactNode;
  text: string;
};

/* ─── Metric card (horizontal style) ───────────────────────── */

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  accent?: string;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Icon block */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-6 [&>svg]:w-6"
        style={{
          backgroundColor:
            accent ??
            "color-mix(in srgb, var(--admin-primary, #581c22) 12%, transparent)",
          color: "var(--admin-primary, #581c22)",
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-stone-400">
          {title}
        </p>
        <p className="truncate text-xl font-bold tabular-nums text-stone-900">
          {value}
        </p>
        {subtitle && (
          <p className="truncate text-xs text-stone-500">{subtitle}</p>
        )}
      </div>

      {/* Arrow */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--admin-primary,#581c22)] text-white">
        <ChevronRightIcon className="h-4 w-4" />
      </div>
    </article>
  );
}

/* ─── Filter bar ────────────────────────────────────────────── */

type Period = "hoy" | "semana" | "mes";
type Category = "todas" | "ventas" | "gastos" | "alertas";

function FilterBar({
  period,
  setPeriod,
  category,
  setCategory,
}: {
  period: Period;
  setPeriod: (p: Period) => void;
  category: Category;
  setCategory: (c: Category) => void;
}) {
  const periods: { value: Period; label: string }[] = [
    { value: "hoy", label: "Hoy" },
    { value: "semana", label: "Semana" },
    { value: "mes", label: "Mes" },
  ];
  const categories: { value: Category; label: string }[] = [
    { value: "todas", label: "Todas" },
    { value: "ventas", label: "Ventas" },
    { value: "gastos", label: "Gastos" },
    { value: "alertas", label: "Alertas" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-stone-400">Filtrar por:</span>

      <div className="flex gap-1.5">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              period === p.value
                ? "bg-[var(--admin-primary,#581c22)] text-white"
                : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              category === c.value
                ? "bg-stone-800 text-white"
                : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleAlerts, setVisibleAlerts] = useState(5);
  const [period, setPeriod] = useState<Period>("hoy");
  const [category, setCategory] = useState<Category>("todas");

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

  const alerts: Alert[] = [];
  data.alerts.lowStock.forEach((i) =>
    alerts.push({
      bg: "bg-amber-50",
      border: "border-amber-400",
      icon: <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />,
      text: `Bajo stock: ${i.name} (${i.stock} restantes)`,
    }),
  );
  if (data.alerts.recentHighExpense) {
    alerts.push({
      bg: "bg-red-50",
      border: "border-red-400",
      icon: <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-500" />,
      text: `Gasto reciente: ${data.alerts.recentHighExpense.description} (${formatCOP(data.alerts.recentHighExpense.amount)})`,
    });
  }
  if (data.alerts.upcomingReservations > 0) {
    alerts.push({
      bg: "bg-blue-50",
      border: "border-blue-400",
      icon: <CalendarDaysIcon className="h-4 w-4 shrink-0 text-blue-500" />,
      text: `${data.alerts.upcomingReservations} reserva${data.alerts.upcomingReservations > 1 ? "s" : ""} en las próximas 24h`,
    });
  }

  /* Sales value shown based on selected period */
  const salesValue =
    period === "hoy"
      ? data.salesToday
      : period === "semana"
        ? data.salesWeek
        : data.salesMonth;

  /* Metrics list — filtered by category */
  const allMetrics = [
    {
      key: "ventas",
      title:
        period === "hoy"
          ? "Ventas de hoy"
          : period === "semana"
            ? "Ventas de la semana"
            : "Ventas del mes",
      value: formatCOP(salesValue),
      icon: <BanknotesIcon />,
      category: "ventas" as Category,
    },
    {
      key: "pedidos",
      title: "Total de pedidos",
      value: String(data.totalOrders),
      icon: <ShoppingBagIcon />,
      category: "ventas" as Category,
    },
    {
      key: "ticket",
      title: "Ticket promedio",
      value: formatCOP(data.avgTicket),
      icon: <ReceiptIcon />,
      category: "ventas" as Category,
    },
    {
      key: "mes",
      title: "Ventas del mes",
      value: formatCOP(data.salesMonth),
      icon: <TrendingUpIcon />,
      category: "ventas" as Category,
    },
    {
      key: "gastos",
      title: "Gasto total del periodo",
      value: formatCOP(data.totalExpenses),
      icon: <ArrowDownIcon />,
      category: "gastos" as Category,
    },
    {
      key: "ganancia",
      title: "Ganancia estimada",
      value: formatCOP(data.profitEstimated),
      icon: <CheckCircleIcon />,
      category: "ventas" as Category,
    },
    {
      key: "plato",
      title: "Plato más vendido",
      value: data.bestItem?.name ?? "Sin datos",
      subtitle: data.bestItem ? `${data.bestItem.units} unidades` : undefined,
      icon: <StarIcon />,
      category: "ventas" as Category,
    },
  ];

  const visibleMetrics =
    category === "todas" || category === "alertas"
      ? allMetrics
      : allMetrics.filter((m) => m.category === category);

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <FilterBar
        period={period}
        setPeriod={setPeriod}
        category={category}
        setCategory={setCategory}
      />

      {/* Metric cards */}
      {category !== "alertas" && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {visibleMetrics.map((m) => (
            <MetricCard
              key={m.key}
              title={m.title}
              value={m.value}
              subtitle={"subtitle" in m ? m.subtitle : undefined}
              icon={m.icon}
            />
          ))}
        </section>
      )}

      {/* Chart + Alerts */}
      {(category === "todas" || category === "ventas") && (
        <article className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-1">
            <h3 className="text-sm font-semibold text-stone-800">
              Ventas por día (últimos 7 días)
            </h3>
          </div>
          {data.salesByDay.every((d) => d.value === 0) ? (
            <p className="mt-10 text-center text-sm text-stone-400">
              Sin ventas registradas esta semana
            </p>
          ) : (
            <div className="mt-4 flex h-52 items-end gap-1.5 overflow-visible">
              {data.salesByDay.map((d) => {
                const heightPct = (d.value / maxDay) * 100;
                const isMax = d.value === maxDay && d.value > 0;
                return (
                  <div
                    key={d.label}
                    className="group relative flex flex-1 flex-col items-center"
                  >
                    {d.value > 0 && (
                      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {formatCOP(d.value)}
                      </div>
                    )}
                    <div
                      className="w-full rounded-t-md bg-[var(--admin-primary,#581c22)] transition-all duration-300"
                      style={{
                        height: `${heightPct}%`,
                        minHeight: d.value > 0 ? "4px" : "0",
                        opacity: isMax ? 1 : 0.65,
                      }}
                    />
                    <span className="mt-1.5 text-[11px] font-medium text-stone-500">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      )}

      {(category === "todas" || category === "alertas") && (
        <article className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-stone-800">
              Alertas activas
            </h3>
            {alerts.length > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                {alerts.length}
              </span>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircleIcon className="mb-2 h-8 w-8 text-emerald-400" />
              <p className="text-sm font-medium text-stone-500">
                Sin alertas activas
              </p>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {alerts.slice(0, visibleAlerts).map((a, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-2.5 rounded-xl border-l-4 p-3 text-sm font-medium ${a.bg} ${a.border}`}
                  >
                    <span className="mt-0.5">{a.icon}</span>
                    <span className="text-stone-700">{a.text}</span>
                  </li>
                ))}
              </ul>
              {alerts.length > 5 && visibleAlerts < alerts.length && (
                <button
                  onClick={() => setVisibleAlerts((v) => v + 5)}
                  className="mt-3 w-full rounded-xl border border-stone-200 py-2 text-xs font-medium text-stone-500 hover:bg-stone-50"
                >
                  Ver {alerts.length - visibleAlerts} más
                </button>
              )}
            </>
          )}
        </article>
      )}

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
