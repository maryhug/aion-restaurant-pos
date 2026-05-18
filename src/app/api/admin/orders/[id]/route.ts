import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const { id } = await params;

  const order = await prisma.orders.findFirst({
    where: {
      id,
      restaurant_id: restaurantId,
    },
    include: {
      tables: { select: { number: true } },
      reservations: {
        select: {
          customer_name: true,
          customer_phone: true,
          customer_email: true,
          party_size: true,
          users: { select: { id: true, name: true, email: true } },
        },
      },
      placed_by_user: { select: { id: true, name: true, email: true } },
      order_items: {
        include: {
          menu_items: { select: { name: true, category: true } },
        },
      },
      sales: {
        select: {
          payment_method: true,
          payment_status: true,
          total: true,
          cash_received: true,
          change_given: true,
          created_at: true,
        },
        take: 1,
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Pedido no encontrado" },
      { status: 404 },
    );
  }

  // Priority: direct field > placed_by_user > reservation customer_name > reservation user
  const customerName =
    order.customer_name ??
    order.placed_by_user?.name ??
    order.reservations?.customer_name ??
    order.reservations?.users?.name ??
    null;

  const customerEmail =
    order.placed_by_user?.email ??
    order.reservations?.users?.email ??
    order.reservations?.customer_email ??
    null;

  const partySize = order.reservations?.party_size ?? null;

  return NextResponse.json({
    id: order.id.slice(-8).toUpperCase(),
    fullId: order.id,
    date: order.created_at.toISOString(),
    paidAt: order.paid_at?.toISOString() ?? null,
    deliveredAt: order.delivered_at?.toISOString() ?? null,
    table: order.tables ? `Mesa ${order.tables.number}` : null,
    status: order.status,
    orderType: order.order_type ?? null,
    notes: order.notes ?? null,
    total: Number(order.total),
    customerName,
    customerEmail,
    customerPhone:
      order.customer_phone ?? order.reservations?.customer_phone ?? null,
    partySize,
    items: order.order_items.map((item) => ({
      name: item.menu_items?.name ?? "Ítem eliminado",
      category: item.menu_items?.category ?? "",
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      subtotal: item.quantity * Number(item.unit_price),
    })),
    payment: order.sales[0]
      ? {
          method: order.sales[0].payment_method,
          status: order.sales[0].payment_status ?? "pending",
          total: Number(order.sales[0].total),
          cashReceived: order.sales[0].cash_received
            ? Number(order.sales[0].cash_received)
            : null,
          changeGiven: order.sales[0].change_given
            ? Number(order.sales[0].change_given)
            : null,
          paidAt: order.sales[0].created_at.toISOString(),
        }
      : null,
  });
}
