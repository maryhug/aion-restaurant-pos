import prisma from "@/lib/prisma";

export type AdminKpi = {
  totalSales: number;
  totalSalesDeltaPct: number;
  orders: number;
  ordersDeltaPct: number;
  avgTicket: number;
  avgTicketDeltaPct: number;
  customers: number;
  customersDeltaPct: number;
};

export type SalesDay = {
  dayLabel: string;
  amount: number;
};

export type CategorySlice = {
  category: string;
  quantity: number;
};

export type TopDish = {
  id: string;
  name: string;
  sold: number;
  revenue: number;
};

export type AdminDashboardData = {
  kpi: AdminKpi;
  salesByDay: SalesDay[];
  categoryDistribution: CategorySlice[];
  topDishes: TopDish[];
};

type GroupedOrderItem = {
  menu_item_id: string;
  _sum: { quantity: number | null };
};

type MenuItemBasic = {
  id: string;
  name: string;
};

function percentageDelta(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    const decimalLike = value as { toNumber: () => number };
    return decimalLike.toNumber();
  }
  return 0;
}

function monthRange(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const next = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  const prev = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  return { start, next, prev };
}

function formatDayLabel(date: Date): string {
  return date
    .toLocaleDateString("es-CO", { weekday: "short" })
    .replace(".", "");
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const { start, next, prev } = monthRange();
  const lastWeekStart = new Date();
  lastWeekStart.setDate(lastWeekStart.getDate() - 6);
  lastWeekStart.setHours(0, 0, 0, 0);

  const [
    currentSales,
    previousSales,
    currentOrders,
    previousOrders,
    currentCustomers,
    previousCustomers,
    weekSales,
    groupedItems,
  ] = await Promise.all([
    prisma.sales.aggregate({
      where: { created_at: { gte: start, lt: next } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.sales.aggregate({
      where: { created_at: { gte: prev, lt: start } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.orders.count({ where: { created_at: { gte: start, lt: next } } }),
    prisma.orders.count({ where: { created_at: { gte: prev, lt: start } } }),
    prisma.reservations.findMany({
      where: { created_at: { gte: start, lt: next } },
      select: { user_id: true },
      distinct: ["user_id"],
    }),
    prisma.reservations.findMany({
      where: { created_at: { gte: prev, lt: start } },
      select: { user_id: true },
      distinct: ["user_id"],
    }),
    prisma.sales.findMany({
      where: { created_at: { gte: lastWeekStart } },
      select: { total: true, created_at: true },
      orderBy: { created_at: "asc" },
    }),
    prisma.order_items.groupBy({
      by: ["menu_item_id"],
      where: { orders: { created_at: { gte: start, lt: next } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const topDishIds = (groupedItems as GroupedOrderItem[]).map(
    (item) => item.menu_item_id,
  );

  const [menuItems, monthOrderItems] = await Promise.all([
    prisma.menu_items.findMany({
      where: { id: { in: topDishIds } },
      select: { id: true, name: true },
    }),
    prisma.order_items.findMany({
      where: { orders: { created_at: { gte: start, lt: next } } },
      select: {
        quantity: true,
        unit_price: true,
        menu_item_id: true,
        menu_items: { select: { category: true } },
      },
    }),
  ]);

  const menuById = new Map(
    (menuItems as MenuItemBasic[]).map((item) => [item.id, item.name]),
  );

  const revenueByDishId = new Map<string, number>();
  const quantityByCategory = new Map<string, number>();

  for (const item of monthOrderItems) {
    const revenue = toNumber(item.unit_price) * item.quantity;
    revenueByDishId.set(
      item.menu_item_id,
      (revenueByDishId.get(item.menu_item_id) ?? 0) + revenue,
    );

    const category = item.menu_items?.category ?? "sin_categoria";
    quantityByCategory.set(
      category,
      (quantityByCategory.get(category) ?? 0) + item.quantity,
    );
  }

  const topDishes: TopDish[] = (groupedItems as GroupedOrderItem[]).map(
    (item) => ({
      id: item.menu_item_id,
      name: menuById.get(item.menu_item_id) ?? "Plato sin nombre",
      sold: item._sum.quantity ?? 0,
      revenue: revenueByDishId.get(item.menu_item_id) ?? 0,
    }),
  );

  const salesDayMap = new Map<string, number>();
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(lastWeekStart);
    day.setDate(lastWeekStart.getDate() + i);
    salesDayMap.set(formatDayLabel(day), 0);
  }

  for (const sale of weekSales) {
    const key = formatDayLabel(new Date(sale.created_at));
    salesDayMap.set(key, (salesDayMap.get(key) ?? 0) + toNumber(sale.total));
  }

  const totalSales = toNumber(currentSales._sum.total);
  const prevTotalSales = toNumber(previousSales._sum.total);
  const avgTicket =
    currentSales._count._all > 0 ? totalSales / currentSales._count._all : 0;
  const prevAvgTicket =
    previousSales._count._all > 0
      ? prevTotalSales / previousSales._count._all
      : 0;

  return {
    kpi: {
      totalSales,
      totalSalesDeltaPct: percentageDelta(totalSales, prevTotalSales),
      orders: currentOrders,
      ordersDeltaPct: percentageDelta(currentOrders, previousOrders),
      avgTicket,
      avgTicketDeltaPct: percentageDelta(avgTicket, prevAvgTicket),
      customers: currentCustomers.length,
      customersDeltaPct: percentageDelta(
        currentCustomers.length,
        previousCustomers.length,
      ),
    },
    salesByDay: Array.from(salesDayMap.entries()).map(([dayLabel, amount]) => ({
      dayLabel,
      amount,
    })),
    categoryDistribution: Array.from(quantityByCategory.entries())
      .map(([category, quantity]) => ({ category, quantity }))
      .sort((a, b) => b.quantity - a.quantity),
    topDishes,
  };
}
