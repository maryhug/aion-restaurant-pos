import type { Database } from "@/types/database";
import prisma from "@/lib/prisma";
import type { AionDish } from "@/lib/aion/types";

type MenuItemRow = Database["public"]["Tables"]["menu_items"]["Row"];

const validCategories: AionDish["category"][] = [
  "entradas",
  "principales",
  "pastas",
  "carnes",
  "mariscos",
  "postres",
  "bebidas",
];

function normalizeCategory(raw: string): AionDish["category"] {
  const normalized = raw.trim().toLowerCase();
  if (validCategories.includes(normalized as AionDish["category"])) {
    return normalized as AionDish["category"];
  }
  return "principales";
}

function fromRow(row: MenuItemRow): AionDish {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "Plato del menú AION",
    // Se asume COP entero en BD para UI actual.
    price: Number(row.price),
    category: normalizeCategory(row.category),
    prepMinutes: 15,
    available: row.available,
    tags: [],
    imageHint: row.image_url ?? undefined,
  };
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return 0;
}

export async function fetchAionMenuDishes(options?: {
  includeUnavailable?: boolean;
}): Promise<AionDish[]> {
  try {
    const includeUnavailable = options?.includeUnavailable ?? false;
    const rows = await prisma.menu_items.findMany({
      where: includeUnavailable ? undefined : { available: true },
      orderBy: { name: "asc" },
    });

    return rows.map((row) =>
      fromRow({
        ...row,
        price: toNumber(row.price),
        cost_price: row.cost_price == null ? null : toNumber(row.cost_price),
        stock: row.stock ?? 0,
        min_stock: row.min_stock ?? 0,
        is_secret: row.is_secret ?? false,
      } as MenuItemRow),
    );
  } catch (error) {
    console.error("Error consultando menu_items:", error);
    return [];
  }
}

export async function fetchAionDishById(id: string): Promise<AionDish | null> {
  try {
    const row = await prisma.menu_items.findUnique({ where: { id } });
    if (!row) return null;

    return fromRow({
      ...row,
      price: toNumber(row.price),
      cost_price: row.cost_price == null ? null : toNumber(row.cost_price),
      stock: row.stock ?? 0,
      min_stock: row.min_stock ?? 0,
      is_secret: row.is_secret ?? false,
    } as MenuItemRow);
  } catch (error) {
    console.error("Error consultando menú por id:", error);
    return null;
  }
}
