import prisma from "@/lib/prisma";
import type { MenuItem } from "@/types/database";
import { AionPreOrderClient } from "@/components/aion/client/pre-order-client";

export default async function AionClientePreOrdenPage() {
  const [menuRows, firstRestaurant] = await Promise.all([
    prisma.menu_items.findMany({
      where: { available: true },
      orderBy: { name: "asc" },
    }),
    prisma.restaurants.findFirst({ select: { id: true } }),
  ]);

  const menuItems: MenuItem[] = menuRows.map((row) => ({
    id: row.id,
    restaurant_id: row.restaurant_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    available: row.available,
    cost_price: row.cost_price ? Number(row.cost_price) : null,
    stock: row.stock ?? 0,
    min_stock: row.min_stock ?? 0,
    is_secret: row.is_secret ?? false,
    image_url: row.image_url,
  }));

  return (
    <AionPreOrderClient
      menuItems={menuItems}
      restaurantId={firstRestaurant?.id ?? null}
    />
  );
}
