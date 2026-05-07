import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { OrderStatus } from "@/types/database";

const transitions: Record<OrderStatus, OrderStatus> = {
  pending: "preparing",
  preparing: "ready",
  ready: "delivered",
  delivered: "delivered",
  cancelled: "cancelled",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      total: true,
      created_at: true,
      table_id: true,
      order_items: {
        select: {
          id: true,
          quantity: true,
          unit_price: true,
          menu_items: { select: { name: true } },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      created_at:
        order.created_at instanceof Date
          ? order.created_at.toISOString()
          : String(order.created_at),
      table_id: order.table_id,
      items: order.order_items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        name: item.menu_items.name,
      })),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  const current = await prisma.orders.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    status?: OrderStatus;
  };
  const requested = body.status;

  if (current.status === "delivered" || current.status === "cancelled") {
    return NextResponse.json({ order: current }, { status: 400 });
  }

  const allowedTargets: Record<OrderStatus, OrderStatus[]> = {
    pending: ["preparing", "cancelled"],
    preparing: ["pending", "ready", "cancelled"],
    ready: ["preparing", "delivered", "cancelled"],
    delivered: [],
    cancelled: [],
  };

  let next = transitions[current.status as OrderStatus];
  if (requested) {
    if (!allowedTargets[current.status as OrderStatus].includes(requested)) {
      return NextResponse.json(
        { error: "Transición de estado no permitida" },
        { status: 400 },
      );
    }
    next = requested;
  }

  const updated = await prisma.orders.update({
    where: { id: orderId },
    data: { status: next },
    select: { id: true, status: true },
  });

  return NextResponse.json({ order: updated });
}
