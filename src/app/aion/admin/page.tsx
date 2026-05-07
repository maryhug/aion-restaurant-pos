import { aion } from "@/lib/aion/tokens";
import { formatCOP } from "@/lib/aion/currency";
import { AionAdminSidebar } from "@/components/aion/admin/sidebar-nav";
import { getServerSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Helpers de fecha
// ---------------------------------------------------------------------------
function monthBounds() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from, to };
}

function weekBounds() {
  const now = new Date();
  // Último de 7 días completos + hoy
  const days: { label: string; from: Date; to: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const from = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const to = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const label = from.toLocaleDateString("es-CO", { weekday: "short" });
    days.push({
      label: label.charAt(0).toUpperCase() + label.slice(1, 3),
      from,
      to,
    });
  }
  return days;
}

// ---------------------------------------------------------------------------
// Fetch de datos reales
// ---------------------------------------------------------------------------
async function fetchDashboardData(restaurantId: string | null) {
  const { from: monthFrom, to: monthTo } = monthBounds();
  const weekDays = weekBounds();

  // Ventas del mes actual para este restaurante
  const salesThisMonth = restaurantId
    ? await prisma.sales.findMany({
        where: {
          restaurant_id: restaurantId,
          created_at: { gte: monthFrom, lt: monthTo },
        },
        select: { total: true, created_at: true },
      })
    : [];

  const totalSales = salesThisMonth.reduce((s, r) => s + Number(r.total), 0);

  // Pedidos del mes
  const ordersThisMonth = restaurantId
    ? await prisma.orders.count({
        where: {
          tables: { restaurant_id: restaurantId },
          created_at: { gte: monthFrom, lt: monthTo },
        },
      })
    : 0;

  const avgTicket = ordersThisMonth > 0 ? totalSales / ordersThisMonth : 0;

  // Total clientes (usuarios con role = "customer")
  const totalCustomers = await prisma.users.count({
    where: { role: "customer" },
  });

  // Ventas por día de la última semana
  const salesByDay = await Promise.all(
    weekDays.map(async (day) => {
      const dayTotal = restaurantId
        ? await prisma.sales.aggregate({
            where: {
              restaurant_id: restaurantId,
              created_at: { gte: day.from, lt: day.to },
            },
            _sum: { total: true },
          })
        : { _sum: { total: null } };
      return { label: day.label, total: Number(dayTotal._sum.total ?? 0) };
    }),
  );

  // Top 5 platos más vendidos (por cantidad en order_items)
  const topItemsRaw = restaurantId
    ? await prisma.order_items.groupBy({
        by: ["menu_item_id"],
        where: {
          orders: {
            tables: { restaurant_id: restaurantId },
            created_at: { gte: monthFrom, lt: monthTo },
          },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      })
    : [];

  const topItems = await Promise.all(
    topItemsRaw.map(async (row) => {
      const item = await prisma.menu_items.findUnique({
        where: { id: row.menu_item_id },
        select: { name: true, price: true },
      });
      const qty = row._sum.quantity ?? 0;
      return {
        name: item?.name ?? "Desconocido",
        qty,
        revenue: qty * Number(item?.price ?? 0),
      };
    }),
  );

  // Ventas por categoría (ingresos = price × quantity por categoría)
  const categoryRaw = restaurantId
    ? await prisma.order_items.findMany({
        where: {
          orders: {
            tables: { restaurant_id: restaurantId },
            created_at: { gte: monthFrom, lt: monthTo },
          },
        },
        select: {
          quantity: true,
          unit_price: true,
          menu_items: { select: { category: true } },
        },
      })
    : [];

  const categoryMap: Record<string, number> = {};
  for (const row of categoryRaw) {
    const cat = row.menu_items.category;
    categoryMap[cat] =
      (categoryMap[cat] ?? 0) + Number(row.unit_price) * row.quantity;
  }

  const totalCatRevenue = Object.values(categoryMap).reduce((s, v) => s + v, 0);
  const categoryData = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([name, revenue]) => ({
      name,
      pct:
        totalCatRevenue > 0 ? Math.round((revenue / totalCatRevenue) * 100) : 0,
    }));

  return {
    totalSales,
    ordersThisMonth,
    avgTicket,
    totalCustomers,
    salesByDay,
    topItems,
    categoryData,
  };
}

// ---------------------------------------------------------------------------
// Colores para categorías (estático, solo visual)
// ---------------------------------------------------------------------------
const CAT_COLORS = ["#600020", "#333333", "#E8A0C4", "#8B4513", "#6B7280"];

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
export default async function AionAdminDashboardPage() {
  const session = await getServerSession();
  const restaurantId = session?.restaurantId ?? null;

  const {
    totalSales,
    ordersThisMonth,
    avgTicket,
    totalCustomers,
    salesByDay,
    topItems,
    categoryData,
  } = await fetchDashboardData(restaurantId);

  const maxDaySales = Math.max(...salesByDay.map((d) => d.total), 1);

  // Construir conic-gradient para el donut de categorías
  const conicStops = categoryData.reduce<
    { color: string; from: number; to: number }[]
  >((acc, cat, i) => {
    const prev = acc[i - 1]?.to ?? 0;
    acc.push({
      color: CAT_COLORS[i] ?? "#ccc",
      from: prev,
      to: prev + cat.pct,
    });
    return acc;
  }, []);
  const conicGradient = conicStops.length
    ? conicStops.map((s) => `${s.color} ${s.from}% ${s.to}%`).join(", ")
    : "#e5e7eb 0 100%";

  const kpis = [
    {
      t: "Ventas del mes",
      v: formatCOP(totalSales),
      sub: `${ordersThisMonth} pedidos`,
      color: aion.colors.text,
    },
    {
      t: "Pedidos",
      v: String(ordersThisMonth),
      sub: "este mes",
      color: aion.colors.text,
    },
    {
      t: "Ticket promedio",
      v: formatCOP(avgTicket),
      sub: "por pedido",
      color: aion.colors.text,
    },
    {
      t: "Clientes",
      v: String(totalCustomers),
      sub: "registrados",
      color: aion.colors.text,
    },
  ];

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
          Datos reales del mes actual · restaurante{" "}
          <span className="font-bold">
            {restaurantId ? "activo" : "sin sesión"}
          </span>
        </p>

        {/* KPIs */}
        <ul className="mt-3 grid list-none grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
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
                  style={{ color: k.color }}
                >
                  {k.v}
                </p>
                <p className="text-xs" style={{ color: aion.colors.muted }}>
                  {k.sub}
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
        </ul>

        <div className="mt-3 grid list-none grid-cols-1 gap-2 lg:grid-cols-2">
          {/* Gráfica ventas por día */}
          <li className="min-h-[240px] flex-1 rounded-2xl bg-white p-3 ring-1 ring-black/5">
            <h2
              className="text-sm font-extrabold"
              style={{ color: aion.colors.text }}
            >
              Ventas por día
            </h2>
            <p className="text-xs" style={{ color: aion.colors.muted }}>
              Últimos 7 días
            </p>
            <div className="mt-3 flex h-44 items-end justify-between gap-0.5 border-b border-l border-stone-200 pl-0.5 sm:pl-1">
              {salesByDay.map((w) => {
                const pct = Math.max(2, (w.total / maxDaySales) * 100);
                return (
                  <div
                    key={w.label}
                    className="flex flex-1 flex-col items-center"
                  >
                    <div
                      className="w-4/5 max-w-[2rem] rounded-t-md sm:max-w-[2.5rem]"
                      style={{
                        height: `${pct}%`,
                        background: aion.colors.primary,
                        minHeight: "4px",
                      }}
                      title={`${w.label}: ${formatCOP(w.total)}`}
                    />
                    <p
                      className="mt-1 text-[9px] sm:text-[10px]"
                      style={{ color: aion.colors.muted }}
                    >
                      {w.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </li>

          {/* Donut por categoría */}
          <li className="flex min-h-[240px] flex-1 flex-col rounded-2xl bg-white p-3 ring-1 ring-black/5">
            <h2
              className="text-sm font-extrabold"
              style={{ color: aion.colors.text }}
            >
              Por categoría
            </h2>
            <p className="text-xs" style={{ color: aion.colors.muted }}>
              Ingresos este mes
            </p>
            {categoryData.length > 0 ? (
              <div className="mt-2 flex flex-1 items-center justify-center gap-4">
                <div
                  className="size-28 rounded-full sm:size-32"
                  style={{ background: `conic-gradient(${conicGradient})` }}
                  aria-label="Distribución por categoría"
                />
                <ul
                  className="min-w-0 list-none space-y-0.5 text-[11px]"
                  style={{ color: aion.colors.muted }}
                >
                  {categoryData.map((c, i) => (
                    <li key={c.name}>
                      <span
                        className="mr-1 inline-block size-2.5 align-middle rounded"
                        style={{ background: CAT_COLORS[i] ?? "#ccc" }}
                      />
                      {c.name} ({c.pct}%)
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p
                className="mt-4 text-center text-sm"
                style={{ color: aion.colors.muted }}
              >
                Sin ventas este mes
              </p>
            )}
          </li>
        </div>

        {/* Top platos */}
        <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
          <h2
            className="text-sm font-extrabold"
            style={{ color: aion.colors.text }}
          >
            Platos más vendidos
          </h2>
          <p className="text-xs" style={{ color: aion.colors.muted }}>
            Top 5 del mes por unidades
          </p>
          {topItems.length > 0 ? (
            <ol className="mt-2 list-none">
              {topItems.map((item, idx) => (
                <li
                  key={item.name}
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
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-bold"
                        style={{ color: aion.colors.text }}
                      >
                        {item.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: aion.colors.muted }}
                      >
                        {item.qty} vendidos
                      </p>
                    </div>
                  </div>
                  <p
                    className="shrink-0 text-sm font-bold"
                    style={{ color: aion.colors.primary }}
                  >
                    {formatCOP(item.revenue)}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p
              className="mt-4 text-center text-sm"
              style={{ color: aion.colors.muted }}
            >
              Sin pedidos este mes
            </p>
          )}
        </div>
      </main>
    </>
  );
}
