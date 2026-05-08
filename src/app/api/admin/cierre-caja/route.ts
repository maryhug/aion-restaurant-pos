import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

function toDate(dt: Date) {
  return dt.toISOString().split("T")[0];
}
function toTime(dt: Date) {
  return dt.toISOString().slice(11, 16);
}
function shiftName(dt: Date) {
  return dt.getUTCHours() < 15 ? "Mañana" : "Noche";
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;

  const shifts = await prisma.cash_shifts.findMany({
    where: { restaurant_id: restaurantId },
    include: {
      closures: true,
      opened_by: { select: { full_name: true } },
      branches: { select: { name: true } },
    },
    orderBy: { opened_at: "desc" },
    take: 20,
  });

  const mapped = shifts.map((s) => {
    const closure = s.closures[0] ?? null;
    return {
      id: s.id,
      date: toDate(s.opened_at),
      shift: shiftName(s.opened_at),
      cashier: s.opened_by?.full_name ?? "Desconocido",
      openTime: toTime(s.opened_at),
      closeTime: s.closed_at ? toTime(s.closed_at) : "-",
      branch: s.branches?.name ?? "-",
      baseFund: Number(s.opening_balance),
      cashSales: closure ? Number(closure.total_sales_cash) : 0,
      cardSales: closure ? Number(closure.total_sales_card) : 0,
      transferSales: closure ? Number(closure.total_sales_transfer) : 0,
      otherIncome: closure ? Number(closure.total_other_income) : 0,
      withdrawals: closure ? Number(closure.total_withdrawals) : 0,
      cashExpenses: closure ? Number(closure.total_cash_expenses) : 0,
      countedCash: closure
        ? Number(closure.counted_cash)
        : Number(s.opening_balance),
      note: s.note ?? closure?.note ?? undefined,
    };
  });

  const current = mapped.find((_, i) => shifts[i].status === "open") ?? null;
  const closings = mapped.filter((_, i) => shifts[i].status !== "open");

  return NextResponse.json({ current, closings });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();

  const countedCash = Number(body.countedCash ?? 0);
  const note = body.note ? String(body.note) : null;

  const register = await prisma.cash_registers.findFirst({
    where: { restaurant_id: restaurantId, is_active: true },
    select: { id: true, branch_id: true },
  });
  if (!register) {
    return NextResponse.json(
      { error: "No hay caja registradora activa" },
      { status: 400 },
    );
  }

  let branchId: string | null = register.branch_id;
  if (body.branchId) {
    const b = await prisma.branches.findFirst({
      where: { id: body.branchId, restaurant_id: restaurantId },
      select: { id: true },
    });
    if (b) branchId = b.id;
  }

  const openShift = await prisma.cash_shifts.findFirst({
    where: { restaurant_id: restaurantId, status: "open" },
    include: { closures: { select: { id: true } } },
  });

  if (openShift && openShift.closures.length === 0) {
    const expected = Number(openShift.opening_balance);
    const diff = countedCash - expected;
    const closureStatus =
      diff === 0 ? "cuadrado" : diff > 0 ? "sobrante" : "faltante";

    await prisma.$transaction([
      prisma.cash_closures.create({
        data: {
          restaurant_id: restaurantId,
          branch_id: branchId,
          cash_shift_id: openShift.id,
          expected_cash: expected,
          counted_cash: countedCash,
          difference: diff,
          status: closureStatus,
          note,
        },
      }),
      prisma.cash_shifts.update({
        where: { id: openShift.id },
        data: { status: "closed", closed_at: new Date(), note },
      }),
    ]);
  } else {
    const shiftDate = body.fecha
      ? new Date(`${body.fecha}T12:00:00Z`)
      : new Date();
    const newShift = await prisma.cash_shifts.create({
      data: {
        restaurant_id: restaurantId,
        branch_id: branchId,
        cash_register_id: register.id,
        opened_at: shiftDate,
        closed_at: new Date(),
        opening_balance: 0,
        status: "closed",
        note,
      },
    });

    const diff = countedCash;
    await prisma.cash_closures.create({
      data: {
        restaurant_id: restaurantId,
        branch_id: branchId,
        cash_shift_id: newShift.id,
        expected_cash: 0,
        counted_cash: countedCash,
        difference: diff,
        status: diff >= 0 ? "sobrante" : "faltante",
        note,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
