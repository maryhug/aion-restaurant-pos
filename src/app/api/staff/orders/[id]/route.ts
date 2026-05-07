import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth/session";

const TRANSITIONS: Record<string, string> = {
  pending: "preparing",
  preparing: "ready",
  ready: "delivered",
};

// PATCH /api/staff/orders/:id — avanza el estado de la orden
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session?.restaurantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.orders.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      tables: { select: { restaurant_id: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.tables?.restaurant_id !== session.restaurantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const nextStatus = TRANSITIONS[order.status];
  if (!nextStatus) {
    return NextResponse.json(
      { error: "La orden ya está en estado final" },
      { status: 400 },
    );
  }

  const updated = await prisma.orders.update({
    where: { id },
    data: { status: nextStatus },
    select: { id: true, status: true },
  });

  // Si se entregó, crear venta automáticamente
  if (nextStatus === "delivered") {
    const fullOrder = await prisma.orders.findUnique({
      where: { id },
      select: {
        total: true,
        table_id: true,
        tables: { select: { restaurant_id: true } },
      },
    });
    if (fullOrder) {
      await prisma.sales.create({
        data: {
          order_id: id,
          restaurant_id:
            fullOrder.tables?.restaurant_id ?? session.restaurantId,
          table_id: fullOrder.table_id,
          total: fullOrder.total,
          payment_method: "cash",
        },
      });
    }
  }

  return NextResponse.json({ order: updated });
}
