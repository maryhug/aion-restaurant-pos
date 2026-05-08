import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth/session";

type HistoryPeriod = "today" | "week" | "month";

function periodStart(period: HistoryPeriod): Date {
  const now = new Date();

  if (period === "today") {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
  }

  if (period === "week") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.restaurantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const period = (req.nextUrl.searchParams.get("period") ??
    "today") as HistoryPeriod;
  if (!["today", "week", "month"].includes(period)) {
    return NextResponse.json({ error: "Periodo invalido" }, { status: 400 });
  }

  const start = periodStart(period);

  const orders = await prisma.orders.findMany({
    where: {
      created_at: { gte: start },
      OR: [
        { restaurant_id: session.restaurantId },
        { tables: { restaurant_id: session.restaurantId } },
      ],
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      status: true,
      total: true,
      created_at: true,
      table_id: true,
      customer_name: true,
      tables: { select: { number: true } },
      order_items: {
        select: {
          quantity: true,
          menu_items: { select: { id: true, name: true } },
        },
      },
    },
    take: 300,
  });

  const normalized = orders.map((order, idx) => ({
    id: order.id,
    code: `ORD-${String(idx + 1).padStart(3, "0")}`,
    status: order.status,
    total: Number(order.total ?? 0),
    createdAt:
      order.created_at instanceof Date
        ? order.created_at.toISOString()
        : String(order.created_at),
    tableLabel: order.tables ? `Mesa ${order.tables.number}` : "Mesa ?",
    customerName: order.customer_name ?? "Cliente",
    itemsCount: order.order_items.reduce((acc, item) => acc + item.quantity, 0),
  }));

  return NextResponse.json({
    period,
    summary: {
      totalOrders: normalized.length,
      totalSales: normalized.reduce((acc, order) => acc + order.total, 0),
    },
    orders: normalized,
  });
}
