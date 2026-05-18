import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

type ClienteAdmin = {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  lastOrderDate: string | null;
  lastOrderAmount: number;
  totalSpent: number;
  isActive: boolean;
};

export async function GET(req: Request) {
  const auth = await requireAdmin(req as Parameters<typeof requireAdmin>[0]);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;

  // Fetch all paid orders for this restaurant, including both linkage paths:
  // 1. placed_by_user  (online orders)
  // 2. reservation.user  (reservation-based orders)
  const orders = await prisma.orders.findMany({
    where: {
      restaurant_id: restaurantId,
      payment_status: "paid",
      OR: [
        { placed_by_user_id: { not: null } },
        { reservation_id: { not: null } },
      ],
    },
    select: {
      id: true,
      total: true,
      created_at: true,
      customer_name: true,
      placed_by_user: {
        select: { id: true, name: true, email: true },
      },
      reservations: {
        include: {
          users: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const clientMap = new Map<string, ClienteAdmin>();

  for (const order of orders) {
    // Resolve user: placed_by_user takes priority, then reservation user
    const user = order.placed_by_user ?? order.reservations?.users ?? null;
    if (!user) continue;

    const uid = user.id;
    const name = order.customer_name ?? user.name ?? "Sin nombre";

    if (!clientMap.has(uid)) {
      clientMap.set(uid, {
        id: uid,
        name,
        email: user.email,
        totalOrders: 0,
        lastOrderDate: null,
        lastOrderAmount: 0,
        totalSpent: 0,
        isActive: false,
      });
    }

    const c = clientMap.get(uid)!;
    c.totalOrders++;
    c.totalSpent += Number(order.total);

    const iso = order.created_at.toISOString();
    if (!c.lastOrderDate || iso > c.lastOrderDate) {
      c.lastOrderDate = iso;
      c.lastOrderAmount = Number(order.total);
    }
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const clients = Array.from(clientMap.values())
    .map((c) => ({
      ...c,
      isActive: c.lastOrderDate
        ? new Date(c.lastOrderDate) > thirtyDaysAgo
        : false,
    }))
    .sort((a, b) =>
      (b.lastOrderDate ?? "").localeCompare(a.lastOrderDate ?? ""),
    );

  return NextResponse.json({ clients });
}
