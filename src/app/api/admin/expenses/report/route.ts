import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenantSession } from "@/lib/auth/session";

function parseYearMonth(req: NextRequest): { year: number; month: number } {
  const now = new Date();
  const year = Number(
    req.nextUrl.searchParams.get("year") ?? now.getFullYear(),
  );
  const month = Number(
    req.nextUrl.searchParams.get("month") ?? now.getMonth() + 1,
  );

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Parámetros year/month inválidos");
  }

  return { year, month };
}

function monthBounds(
  year: number,
  month: number,
): { from: Date; toExclusive: Date } {
  const from = new Date(`${year}-${String(month).padStart(2, "0")}-01`);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const toExclusive = new Date(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  );
  return { from, toExclusive };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenantSession();
    const { year, month } = parseYearMonth(req);
    const { from, toExclusive } = monthBounds(year, month);

    const [sales, expenses, orders] = await Promise.all([
      prisma.sales.findMany({
        where: {
          restaurant_id: session.restaurantId!,
          created_at: { gte: from, lt: toExclusive },
        },
        select: { total: true },
      }),
      prisma.expenses.findMany({
        where: {
          restaurant_id: session.restaurantId!,
          date: { gte: from, lt: toExclusive },
        },
        select: { amount: true },
      }),
      prisma.orders.findMany({
        where: {
          created_at: { gte: from, lt: toExclusive },
          tables: { restaurant_id: session.restaurantId! },
        },
        select: { id: true },
      }),
    ]);

    const orderIds = orders.map((o) => o.id);
    let totalCosts = 0;

    if (orderIds.length > 0) {
      const orderItems = await prisma.order_items.findMany({
        where: { order_id: { in: orderIds } },
        select: {
          quantity: true,
          menu_items: { select: { cost_price: true } },
        },
      });

      totalCosts = orderItems.reduce(
        (s, item) =>
          s + (Number(item.menu_items.cost_price) || 0) * item.quantity,
        0,
      );
    }

    const totalSales = sales.reduce((s, r) => s + Number(r.total), 0);
    const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount), 0);

    return NextResponse.json(
      {
        totalSales,
        totalCosts,
        totalExpenses,
        profit: totalSales - totalCosts - totalExpenses,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
