import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
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
): { from: string; toExclusive: string } {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const toExclusive = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { from, toExclusive };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenantSession();
    const { year, month } = parseYearMonth(req);
    const { from, toExclusive } = monthBounds(year, month);

    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("total")
      .eq("restaurant_id", session.restaurantId!)
      .gte("created_at", from)
      .lt("created_at", toExclusive);
    if (salesError) {
      return NextResponse.json({ error: salesError.message }, { status: 500 });
    }

    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("amount")
      .eq("restaurant_id", session.restaurantId!)
      .gte("date", from)
      .lt("date", toExclusive);
    if (expensesError) {
      return NextResponse.json(
        { error: expensesError.message },
        { status: 500 },
      );
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, tables!inner(restaurant_id)")
      .eq("tables.restaurant_id", session.restaurantId!)
      .gte("created_at", from)
      .lt("created_at", toExclusive);
    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const orderIds = (orders ?? []).map((o: { id: string }) => o.id);
    let totalCosts = 0;
    if (orderIds.length > 0) {
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("quantity, menu_items(cost_price)")
        .in("order_id", orderIds);
      if (itemsError) {
        return NextResponse.json(
          { error: itemsError.message },
          { status: 500 },
        );
      }

      totalCosts = (orderItems ?? []).reduce(
        (
          sum: number,
          item: {
            quantity: number;
            menu_items: { cost_price: number | null } | null;
          },
        ) => sum + (item.menu_items?.cost_price ?? 0) * item.quantity,
        0,
      );
    }

    const totalSales = (sales ?? []).reduce(
      (sum: number, item: { total: number }) => sum + Number(item.total),
      0,
    );
    const totalExpenses = (expenses ?? []).reduce(
      (sum: number, item: { amount: number }) => sum + Number(item.amount),
      0,
    );

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
