import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/orders — crea una orden desde una preorden del cliente (guest-friendly)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      restaurantId?: string;
      tableId?: string | null;
      items?: { menuItemId: string; quantity: number; unitPrice: number }[];
    };

    const { restaurantId, tableId, items } = body;

    if (!restaurantId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "restaurantId e items son obligatorios" },
        { status: 400 },
      );
    }

    // Verificar que los menuItems pertenecen a este restaurante
    const menuIds = items.map((i) => i.menuItemId);
    const dbItems = await prisma.menu_items.findMany({
      where: {
        id: { in: menuIds },
        restaurant_id: restaurantId,
        available: true,
      },
      select: { id: true, price: true },
    });

    if (dbItems.length !== menuIds.length) {
      return NextResponse.json(
        { error: "Uno o más ítems no son válidos para este restaurante" },
        { status: 400 },
      );
    }

    const total = dbItems.reduce((sum, dbItem) => {
      const reqItem = items.find((i) => i.menuItemId === dbItem.id);
      return sum + Number(dbItem.price) * (reqItem?.quantity ?? 0);
    }, 0);

    const order = await prisma.orders.create({
      data: {
        table_id: tableId ?? null,
        status: "pending",
        total,
        order_items: {
          create: dbItems.map((dbItem) => {
            const reqItem = items.find((i) => i.menuItemId === dbItem.id)!;
            return {
              menu_item_id: dbItem.id,
              quantity: reqItem.quantity,
              unit_price: dbItem.price,
            };
          }),
        },
      },
      select: { id: true, status: true, total: true, created_at: true },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear orden";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
