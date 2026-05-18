import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;

  const orders = await prisma.orders.findMany({
    where: { restaurant_id: restaurantId },
    include: {
      tables: { select: { number: true } },
      reservations: {
        select: {
          customer_name: true,
          customer_email: true,
          users: { select: { name: true, email: true } },
        },
      },
      placed_by_user: { select: { name: true, email: true } },
      sales: { select: { payment_method: true }, take: 1 },
    },
    orderBy: { created_at: "desc" },
  });

  const mapped = orders.map((o) => ({
    id: o.id.slice(-8).toUpperCase(),
    fullId: o.id,
    date: o.created_at.toISOString(),
    tableOrType: o.tables ? `Mesa ${o.tables.number}` : "Sin mesa",
    // Priority: direct field > placed_by_user > reservation customer_name > reservation user
    customer:
      o.customer_name ??
      o.placed_by_user?.name ??
      o.reservations?.customer_name ??
      o.reservations?.users?.name ??
      "-",
    status: o.status,
    paymentMethod: o.sales[0]?.payment_method ?? "pendiente",
    total: Number(o.total),
  }));

  return NextResponse.json({ orders: mapped, total: mapped.length });
}
