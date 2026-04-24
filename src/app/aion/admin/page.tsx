import { aion } from "@/lib/aion/tokens";
import { formatCOP } from "@/lib/aion/currency";
import { AionAdminSidebar } from "@/components/aion/admin/sidebar-nav";
import { getAdminDashboardData } from "@/lib/db/admin-dashboard";

function deltaText(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export default async function AionAdminDashboardPage() {
  const data = await getAdminDashboardData();
  const maxH = Math.max(...data.salesByDay.map((d) => d.amount), 1);
  const topCategoryTotal = data.categoryDistribution.reduce(
    (sum, c) => sum + c.quantity,
    0,
  );

  return (
    <>
      <AionAdminSidebar current="dashboard" />
      <main className="min-w-0 flex-1 p-3 sm:p-4">
        <h1
          className="text-2xl font-extrabold"
          style={{ color: aion.colors.text }}
        >
          Panel de ventas
        </h1>
        <p className="text-sm" style={{ color: aion.colors.muted }}>
          KPIs en tiempo real desde la base de datos
        </p>
        <div className="mt-3 grid list-none grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: "Ventas totales",
              v: formatCOP(data.kpi.totalSales),
              d: deltaText(data.kpi.totalSalesDeltaPct),
              u: data.kpi.totalSalesDeltaPct >= 0,
            },
            {
              t: "Pedidos",
              v: String(data.kpi.orders),
              d: deltaText(data.kpi.ordersDeltaPct),
              u: data.kpi.ordersDeltaPct >= 0,
            },
            {
              t: "Ticket promedio",
              v: formatCOP(data.kpi.avgTicket),
              d: deltaText(data.kpi.avgTicketDeltaPct),
              u: data.kpi.avgTicketDeltaPct >= 0,
            },
            {
              t: "Clientes",
              v: String(data.kpi.customers),
              d: deltaText(data.kpi.customersDeltaPct),
              u: data.kpi.customersDeltaPct >= 0,
            },
          ].map((k) => (
            <li
              key={k.t}
              className="flex flex-1 items-center justify-between gap-2 rounded-2xl bg-white p-3 ring-1 ring-black/5"
            >
              <div>
                <p className="text-xs" style={{ color: aion.colors.muted }}>
                  {k.t}
                </p>
                <p
                  className="text-2xl font-extrabold"
                  style={{ color: aion.colors.text }}
                >
                  {k.v}
                </p>
                <p
                  className="text-sm font-bold"
                  style={{
                    color: k.u ? aion.colors.success : aion.colors.danger,
                  }}
                >
                  {k.d}
                </p>
              </div>
              <div
                className="grid size-9 shrink-0 place-items-center rounded-xl text-sm"
                style={{ background: aion.colors.pillInactive }}
                aria-hidden
              >
                •
              </div>
            </li>
          ))}
        </div>
        <div className="mt-3 grid list-none grid-cols-1 gap-2 lg:grid-cols-2">
          <li className="min-h-[240px] flex-1 rounded-2xl bg-white p-3 ring-1 ring-black/5">
            <h2
              className="text-sm font-extrabold"
              style={{ color: aion.colors.text }}
            >
              Ventas por día
            </h2>
            <p className="text-xs" style={{ color: aion.colors.muted }}>
              Ingresos de los últimos 7 días
            </p>
            <div className="mt-3 flex h-44 items-end justify-between gap-0.5 border-b border-l border-stone-200 pl-0.5 sm:pl-1">
              {data.salesByDay.map((w) => {
                const pct = Math.max(0.1, (w.amount / maxH) * 100);
                return (
                  <div
                    key={w.dayLabel}
                    className="flex flex-1 flex-col items-center"
                  >
                    <div
                      className="w-4/5 max-w-[2rem] min-h-[0.5rem] rounded-t-md sm:max-w-[2.5rem]"
                      style={{
                        height: `${pct}%`,
                        background: "#600020",
                        minHeight: "8px",
                      }}
                      title={`${w.dayLabel}: ${formatCOP(w.amount)}`}
                    />
                    <p
                      className="text-[9px] sm:text-[10px] mt-1"
                      style={{ color: aion.colors.muted }}
                    >
                      {w.dayLabel}
                    </p>
                  </div>
                );
              })}
            </div>
          </li>
          <li className="flex min-h-[240px] flex-1 flex-col rounded-2xl bg-white p-3 ring-1 ring-black/5">
            <h2
              className="text-sm font-extrabold"
              style={{ color: aion.colors.text }}
            >
              Por categoría
            </h2>
            <p className="text-xs" style={{ color: aion.colors.muted }}>
              Distribución por cantidad vendida este mes
            </p>
            <div className="mt-2 flex flex-1 items-center justify-center gap-4">
              <div className="size-28 sm:size-32 rounded-full bg-stone-100 grid place-items-center text-xs text-stone-500">
                {topCategoryTotal > 0 ? `${topCategoryTotal} uds` : "Sin datos"}
              </div>
              <ul
                className="min-w-0 list-none text-[11px] space-y-0.5"
                style={{ color: aion.colors.muted }}
              >
                {data.categoryDistribution.slice(0, 5).map((item) => {
                  const pct =
                    topCategoryTotal > 0
                      ? Math.round((item.quantity / topCategoryTotal) * 100)
                      : 0;
                  return (
                    <li key={item.category}>
                      {item.category} - {item.quantity} uds ({pct}%)
                    </li>
                  );
                })}
                {data.categoryDistribution.length === 0 ? (
                  <li>Sin datos de categorías</li>
                ) : null}
              </ul>
            </div>
          </li>
        </div>
        <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
          <h2
            className="text-sm font-extrabold"
            style={{ color: aion.colors.text }}
          >
            Platos más vendidos
          </h2>
          <p className="text-xs" style={{ color: aion.colors.muted }}>
            Top 5 del mes actual
          </p>
          <ol className="mt-2 list-none">
            {data.topDishes.map((i, idx) => (
              <li
                key={i.id}
                className="mb-1 flex items-center justify-between border-b border-stone-100 py-1.5 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="grid size-6 place-items-center rounded-md text-xs font-extrabold"
                    style={{
                      background: aion.colors.pillInactive,
                      color: aion.colors.primary,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div
                    className="size-8 rounded-full"
                    style={{
                      background: aion.colors.pillInactive,
                    }}
                    title={i.name}
                    aria-label="Miniatura de plato"
                  />
                  <div className="min-w-0">
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: aion.colors.text }}
                    >
                      {i.name}
                    </p>
                    <p className="text-xs" style={{ color: aion.colors.muted }}>
                      {i.sold} vendidos
                    </p>
                  </div>
                </div>
                <p
                  className="text-sm font-bold shrink-0"
                  style={{ color: aion.colors.primary }}
                >
                  {formatCOP(i.revenue)} ingresos
                </p>
              </li>
            ))}
            {data.topDishes.length === 0 ? (
              <li className="py-2 text-sm" style={{ color: aion.colors.muted }}>
                Aún no hay ventas registradas este mes.
              </li>
            ) : null}
          </ol>
        </div>
      </main>
    </>
  );
}
