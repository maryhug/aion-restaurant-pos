import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;

  const tableIds = await prisma.tables
    .findMany({ where: { restaurant_id: restaurantId }, select: { id: true } })
    .then((ts) => ts.map((t) => t.id));

  const orders = await prisma.orders.findMany({
    where: { table_id: { in: tableIds } },
    include: {
      tables: { select: { number: true } },
      reservations: {
        include: { users: { select: { name: true } } },
      },
      sales: { select: { payment_method: true }, take: 1 },
    },
    orderBy: { created_at: "desc" },
  });

  const mapped = orders.map((o) => ({
    id: o.id.slice(-8).toUpperCase(),
    fullId: o.id,
    date: o.created_at.toISOString(),
    tableOrType: o.tables ? `Mesa ${o.tables.number}` : "Sin mesa",
    customer: o.reservations?.users?.name ?? "-",
    status: o.status,
    paymentMethod: o.sales[0]?.payment_method ?? "pendiente",
    total: Number(o.total),
  }));

  return NextResponse.json({ orders: mapped, total: mapped.length });
}
