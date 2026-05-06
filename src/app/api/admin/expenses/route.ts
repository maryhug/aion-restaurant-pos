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

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("restaurant_id", session.restaurantId!)
      .gte("date", from)
      .lt("date", toExclusive)
      .order("date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ expenses: data ?? [] }, { status: 200 });
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

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        description: body.description.trim(),
        amount: Number(body.amount),
        category: body.category,
        date: body.date,
        restaurant_id: session.restaurantId!,
        user_id: session.id,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ expense: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
