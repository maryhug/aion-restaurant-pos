import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const tableIds = await prisma.tables
    .findMany({ where: { restaurant_id: restaurantId }, select: { id: true } })
    .then((ts) => ts.map((t) => t.id));

  const [
    salesTodayAgg,
    salesWeekAgg,
    salesMonthAgg,
    salesAvgAgg,
    totalOrders,
    expensesAgg,
    lastExpense,
    weekSales,
    allItems,
    upcomingReservations,
  ] = await Promise.all([
    prisma.sales.aggregate({
      where: { restaurant_id: restaurantId, created_at: { gte: todayStart } },
      _sum: { total: true },
    }),
    prisma.sales.aggregate({
      where: { restaurant_id: restaurantId, created_at: { gte: weekStart } },
      _sum: { total: true },
    }),
    prisma.sales.aggregate({
      where: { restaurant_id: restaurantId, created_at: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.sales.aggregate({
      where: { restaurant_id: restaurantId },
      _avg: { total: true },
    }),
    prisma.orders.count({ where: { table_id: { in: tableIds } } }),
    prisma.expenses.aggregate({
      where: { restaurant_id: restaurantId, date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.expenses.findFirst({
      where: { restaurant_id: restaurantId },
      orderBy: { created_at: "desc" },
      select: { description: true, amount: true },
    }),
    prisma.sales.findMany({
      where: { restaurant_id: restaurantId, created_at: { gte: weekStart } },
      select: { total: true, created_at: true },
    }),
    prisma.menu_items.findMany({
      where: {
        restaurant_id: restaurantId,
        stock: { not: null },
        min_stock: { not: null },
      },
      select: { name: true, stock: true, min_stock: true },
    }),
    prisma.reservations.count({
      where: {
        tables: { restaurant_id: restaurantId },
        date: {
          gte: todayStart,
          lte: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
        },
        status: { not: "cancelled" },
      },
    }),
  ]);

  // Best-selling item
  const topItems = await prisma.order_items.groupBy({
    by: ["menu_item_id"],
    where: { orders: { table_id: { in: tableIds } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 1,
  });

  let bestItem: { name: string; units: number } | null = null;
  if (topItems.length > 0) {
    const item = await prisma.menu_items.findUnique({
      where: { id: topItems[0].menu_item_id },
      select: { name: true },
    });
    bestItem = {
      name: item?.name ?? "-",
      units: topItems[0]._sum.quantity ?? 0,
    };
  }

  // Sales by day — last 7 days
  const salesByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const value = weekSales
      .filter((s) => s.created_at.toISOString().split("T")[0] === dateStr)
      .reduce((sum, s) => sum + Number(s.total), 0);
    return { label: DAY_LABELS[d.getDay()], value };
  });

  // Low-stock alerts
  const lowStock = allItems.filter(
    (i) => i.stock !== null && i.min_stock !== null && i.stock <= i.min_stock,
  );

  const salesMonth = Number(salesMonthAgg._sum.total ?? 0);
  const totalExpenses = Number(expensesAgg._sum.amount ?? 0);

  return NextResponse.json({
    salesToday: Number(salesTodayAgg._sum.total ?? 0),
    salesWeek: Number(salesWeekAgg._sum.total ?? 0),
    salesMonth,
    totalOrders,
    avgTicket: Number(salesAvgAgg._avg.total ?? 0),
    totalExpenses,
    profitEstimated: salesMonth - totalExpenses,
    bestItem,
    salesByDay,
    alerts: {
      lowStock: lowStock.map((i) => ({ name: i.name, stock: i.stock! })),
      upcomingReservations,
      recentHighExpense: lastExpense
        ? {
            description: lastExpense.description,
            amount: Number(lastExpense.amount),
          }
        : null,
    },
  });
}
