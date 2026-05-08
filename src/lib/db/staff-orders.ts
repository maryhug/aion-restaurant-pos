import prisma from "@/lib/prisma";
import type { AionStaffOrder, OrderState } from "@/lib/aion/types";

const ACTIVE_STATUSES = ["pending", "preparing", "ready"] as const;

type ActiveDbStatus = (typeof ACTIVE_STATUSES)[number];

type DbOrder = {
  id: string;
  status: string;
  created_at: Date;
  tables: { number: number } | null;
  reservations: { users: { name: string } | null } | null;
  order_items: Array<{
    menu_item_id: string;
    quantity: number;
    menu_items: { id: string; name: string } | null;
  }>;
};

function mapStatus(status: ActiveDbStatus): OrderState {
  if (status === "pending") return "pendiente";
  if (status === "preparing") return "preparando";
  return "listo";
}

function waitLabel(createdAt: Date): string {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000),
  );
  return `Llegó hace ${minutes}m`;
}

function isUrgent(status: ActiveDbStatus, createdAt: Date): boolean {
  if (status !== "preparing") return false;
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000),
  );
  return minutes >= 12;
}

export async function getActiveStaffOrders(
  restaurantId?: string,
): Promise<AionStaffOrder[]> {
  const orders = (await prisma.orders.findMany({
    where: {
      status: { in: ACTIVE_STATUSES as unknown as string[] },
      ...(restaurantId
        ? {
            OR: [
              { restaurant_id: restaurantId },
              { tables: { restaurant_id: restaurantId } },
            ],
          }
        : {}),
    },
    orderBy: { created_at: "asc" },
    include: {
      tables: { select: { number: true } },
      reservations: {
        select: {
          users: { select: { name: true } },
        },
      },
      order_items: {
        include: {
          menu_items: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })) as DbOrder[];

  return orders.map((order: DbOrder) => {
    const status = order.status as ActiveDbStatus;
    const lines = order.order_items.map(
      (item: DbOrder["order_items"][number]) => ({
        dishId: item.menu_items?.id ?? item.menu_item_id,
        name: item.menu_items?.name ?? "Plato",
        quantity: item.quantity,
      }),
    );

    return {
      id: order.id,
      tableLabel: order.tables ? `Mesa ${order.tables.number}` : "Sin mesa",
      customerName: order.reservations?.users?.name ?? "Cliente",
      state: mapStatus(status),
      waitLabel: waitLabel(order.created_at),
      urgent: isUrgent(status, order.created_at),
      items: lines,
    };
  });
}

export async function advanceStaffOrderStatus(
  orderId: string,
  restaurantId?: string,
): Promise<void> {
  const current = await prisma.orders.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      restaurant_id: true,
      tables: { select: { restaurant_id: true } },
    },
  });
  if (!current) {
    throw new Error("Pedido no encontrado");
  }

  if (restaurantId) {
    const ownerRestaurantId =
      current.restaurant_id ?? current.tables?.restaurant_id;
    if (ownerRestaurantId !== restaurantId) {
      throw new Error("Orden fuera del tenant");
    }
  }

  const nextStatus =
    current.status === "pending"
      ? "preparing"
      : current.status === "preparing"
        ? "ready"
        : current.status === "ready"
          ? "delivered"
          : current.status;

  if (nextStatus === current.status) {
    return;
  }

  await prisma.orders.update({
    where: { id: orderId },
    data: { status: nextStatus },
  });
}
