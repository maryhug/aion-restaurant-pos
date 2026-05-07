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

    const rows = await prisma.expenses.findMany({
      where: {
        restaurant_id: session.restaurantId!,
        date: { gte: from, lt: toExclusive },
      },
      orderBy: { date: "desc" },
    });

    const expenses = rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : r.date,
      created_at:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : r.created_at,
    }));

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenantSession();
    const body = (await req.json()) as {
      description?: string;
      amount?: number;
      category?: string;
      date?: string;
    };

    if (!body.description || !body.amount || !body.category || !body.date) {
      return NextResponse.json(
        { error: "description, amount, category y date son obligatorios" },
        { status: 400 },
      );
    }

    const row = await prisma.expenses.create({
      data: {
        description: body.description.trim(),
        amount: Number(body.amount),
        category: body.category,
        date: new Date(body.date),
        restaurant_id: session.restaurantId!,
        user_id: session.id,
      },
    });

    const expense = {
      ...row,
      amount: Number(row.amount),
      date:
        row.date instanceof Date
          ? row.date.toISOString().slice(0, 10)
          : row.date,
      created_at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : row.created_at,
    };

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
