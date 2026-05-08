import prisma from "@/lib/prisma";
import type { AionDish } from "@/lib/aion/types";

const validCategories: AionDish["category"][] = [
  "adiciones",
  "bebidas",
  "cafés",
  "carnes",
  "cervezas",
  "cócteles",
  "ensaladas",
  "entradas",
  "postres",
  "sangría",
  "smoothies",
  "sándwiches",
  "vino",
];

function normalizeCategory(raw: string): AionDish["category"] {
  const normalized = raw.trim().toLowerCase();
  if (validCategories.includes(normalized as AionDish["category"])) {
    return normalized as AionDish["category"];
  }
  return "entradas";
}

function fromRow(row: {
  id: string;
  name: string;
  description: string | null;
  price: { toNumber(): number } | number;
  category: string;
  available: boolean;
  image_url: string | null;
}): AionDish {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "Plato del menú AION",
    price: typeof row.price === "number" ? row.price : row.price.toNumber(),
    category: normalizeCategory(row.category),
    prepMinutes: 15,
    available: row.available,
    tags: [],
    imageHint: row.image_url ?? undefined,
  };
}

export async function fetchAionMenuDishes(options?: {
  includeUnavailable?: boolean;
  restaurantId?: string;
}): Promise<AionDish[]> {
  const includeUnavailable = options?.includeUnavailable ?? false;

  const restaurantId =
    options?.restaurantId ??
    (
      await prisma.restaurants.findFirst({
        select: { id: true },
        orderBy: { created_at: "asc" },
      })
    )?.id;

  const rows = await prisma.menu_items.findMany({
    where: {
      ...(includeUnavailable ? {} : { available: true }),
      restaurant_id: restaurantId,
    },
    orderBy: { name: "asc" },
  });

  return rows.map(fromRow);
}

export async function fetchAionDishById(id: string): Promise<AionDish | null> {
  const row = await prisma.menu_items.findUnique({ where: { id } });
  if (!row) return null;
  return fromRow(row);
}
