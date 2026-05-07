import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  pending: "recibido",
  preparing: "cocina",
  ready: "listo",
  delivered: "servido",
  cancelled: "cancelado",
};

// GET /api/pedido?orderId=xxx
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json(
      { error: "orderId es obligatorio" },
      { status: 400 },
    );
  }

  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      total: true,
      created_at: true,
      tables: { select: { number: true } },
      order_items: {
        select: {
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
      phase: STATUS_LABEL[order.status] ?? "recibido",
      tableNumber: order.tables?.number ?? null,
      total: Number(order.total),
      createdAt:
        order.created_at instanceof Date
          ? order.created_at.toISOString()
          : String(order.created_at),
      items: order.order_items.map((i) => ({
        name: i.menu_items.name,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
      })),
    },
  });
}
