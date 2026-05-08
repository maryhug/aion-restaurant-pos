import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth/session";

// GET /api/staff/orders — órdenes del restaurante para tablero staff
export async function GET() {
  const session = await getServerSession();
  if (!session?.restaurantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const orders = await prisma.orders.findMany({
    where: {
      status: {
        in: ["pending", "preparing", "ready", "delivered", "cancelled"],
      },
      OR: [
        { restaurant_id: session.restaurantId },
        { tables: { restaurant_id: session.restaurantId } },
      ],
    },
    select: {
      id: true,
      status: true,
      created_at: true,
      tables: { select: { number: true } },
      order_items: {
        select: {
          quantity: true,
          menu_items: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  const now = Date.now();

  const result = orders.map((o) => {
    const createdMs =
      o.created_at instanceof Date
        ? o.created_at.getTime()
        : new Date(o.created_at).getTime();
    const elapsedMin = Math.floor((now - createdMs) / 60000);
    const waitLabel =
      elapsedMin <= 0
        ? "Ahora mismo"
        : elapsedMin === 1
          ? "Hace 1 min"
          : `Hace ${elapsedMin} min`;
    const urgent = o.status === "preparing" && elapsedMin >= 15;

    return {
      id: o.id,
      tableLabel: o.tables ? `Mesa ${o.tables.number}` : "Mesa ?",
      customerName: "",
      status: o.status,
      waitLabel,
      urgent,
      items: o.order_items.map((i) => ({
        dishId: i.menu_items.id,
        name: i.menu_items.name,
        quantity: i.quantity,
        emoji: "",
      })),
    };
  });

  return NextResponse.json({ orders: result });
}
