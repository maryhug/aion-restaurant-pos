import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;

  const expenses = await prisma.expenses.findMany({
    where: { restaurant_id: restaurantId },
    include: { users: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  const mapped = expenses.map((e) => ({
    id: e.id,
    description: e.description,
    category: e.category,
    amount: Number(e.amount),
    date:
      e.date instanceof Date
        ? e.date.toISOString().split("T")[0]
        : String(e.date),
    responsible: e.users?.name ?? "-",
  }));

  const totalPeriod = mapped.reduce((s, e) => s + e.amount, 0);

  const catMap: Record<string, number> = {};
  for (const e of mapped) {
    catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;
  }
  const byCategory = Object.entries(catMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return NextResponse.json({
    expenses: mapped,
    totalPeriod,
    topCategory: byCategory[0]?.label ?? "-",
    avgExpense: mapped.length > 0 ? totalPeriod / mapped.length : 0,
    lastExpense: mapped[0]?.description ?? "-",
    byCategory,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();

  let branchId: string | null = null;
  if (body.branchId) {
    const b = await prisma.branches.findFirst({
      where: { id: body.branchId, restaurant_id: restaurantId },
      select: { id: true },
    });
    branchId = b?.id ?? null;
  }

  const expense = await prisma.expenses.create({
    data: {
      restaurant_id: restaurantId,
      branch_id: branchId,
      description: String(body.description),
      category: String(body.category),
      amount: Number(body.amount),
      date: new Date(body.date),
    },
  });
  return NextResponse.json({ id: expense.id });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();
  const exists = await prisma.expenses.findFirst({
    where: { id: body.id, restaurant_id: restaurantId },
  });
  if (!exists)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await prisma.expenses.update({
    where: { id: body.id },
    data: {
      description: String(body.description),
      category: String(body.category),
      amount: Number(body.amount),
      date: new Date(body.date),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();
  const exists = await prisma.expenses.findFirst({
    where: { id: body.id, restaurant_id: restaurantId },
  });
  if (!exists)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await prisma.expenses.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
