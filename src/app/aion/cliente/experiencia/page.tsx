// src/app/aion/cliente/experiencia/page.tsx
import prisma from "@/lib/prisma";
import type { MenuItem } from "@/types/database";
import { AionExperienceQuizClient } from "@/components/aion/client/experience-quiz-client";
import type { menu_items } from "@prisma/client";

export default async function AionClienteExperienciaPage() {
  const rows = await prisma.menu_items.findMany({
    where: { available: true },
    orderBy: { name: "asc" },
  });

  const menuItems: MenuItem[] = rows.map((row: menu_items) => ({
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

  return <AionExperienceQuizClient menuItems={menuItems} />;
}