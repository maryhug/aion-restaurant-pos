import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { OrderStatus } from "@/types/database";

// POST /api/orders — crea una orden desde una preorden del cliente (guest-friendly)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      restaurantId?: string;
      tableId?: string | null;
      branchId?: string | null;
      customerName?: string | null;
      reservationId?: string | null;
      items?: { menuItemId: string; quantity: number; unitPrice: number }[];
    };

    const {
      restaurantId: bodyRestaurantId,
      tableId,
      branchId,
      items,
      customerName,
      reservationId,
    } = body;

    let restaurantId = bodyRestaurantId ?? null;
    if (!restaurantId && tableId) {
      const table = await prisma.tables.findUnique({
        where: { id: tableId },
        select: { restaurant_id: true },
      });
      restaurantId = table?.restaurant_id ?? null;
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No hay platos en tu pedido." },
        { status: 400 },
      );
    }

    // Verificar los menuItems en DB
    const menuIds = items.map((i) => i.menuItemId);
    const allItems = await prisma.menu_items.findMany({
      where: { id: { in: menuIds } },
      select: {
        id: true,
        restaurant_id: true,
        available: true,
        name: true,
        price: true,
      },
    });

    // Platos que no existen en el menú
    const notFound = menuIds.filter((id) => !allItems.find((i) => i.id === id));
    if (notFound.length > 0) {
      return NextResponse.json(
        {
          error:
            "Algunos platos ya no están en el menú. Por favor recarga la página e intenta de nuevo.",
        },
        { status: 400 },
      );
    }

    // Platos no disponibles
    const unavailable = allItems.filter((i) => !i.available);
    if (unavailable.length > 0) {
      const names = unavailable.map((i) => i.name).join(", ");
      return NextResponse.json(
        {
          error: `Los siguientes platos ya no están disponibles: ${names}. Por favor retíralos de tu pedido.`,
        },
        { status: 400 },
      );
    }

    // Detectar mezcla de platos de distintos restaurantes
    const uniqueRestaurants = [
      ...new Set(allItems.map((i) => i.restaurant_id).filter(Boolean)),
    ];
    if (uniqueRestaurants.length > 1) {
      return NextResponse.json(
        {
          error:
            "Los platos de tu pedido pertenecen a restaurantes distintos. Por favor recarga la página.",
        },
        { status: 400 },
      );
    }

    // Derivar restaurantId desde los propios platos si el cliente no lo envió o no coincide
    const itemsRestaurantId = uniqueRestaurants[0] ?? null;
    if (!restaurantId) restaurantId = itemsRestaurantId;

    if (!restaurantId) {
      return NextResponse.json(
        {
          error:
            "No se pudo identificar el restaurante. Por favor recarga la página.",
        },
        { status: 400 },
      );
    }

    const dbItems = allItems;

    const total = dbItems.reduce((sum, dbItem) => {
      const reqItem = items.find((i) => i.menuItemId === dbItem.id);
      return sum + Number(dbItem.price) * (reqItem?.quantity ?? 0);
    }, 0);

    const order = await prisma.orders.create({
      data: {
        table_id: tableId ?? null,
        restaurant_id: itemsRestaurantId ?? restaurantId,
        branch_id: branchId ?? null,
        reservation_id: reservationId ?? null,
        customer_name: customerName ?? null,
        customer_phone: null,
        status: "pending" satisfies OrderStatus,
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
