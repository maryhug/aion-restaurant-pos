import type { Database } from "@/types/database";
import { supabase } from "@/lib/db/supabase";
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

export async function fetchAionMenuDishes(options?: {
  includeUnavailable?: boolean;
}): Promise<AionDish[]> {
  const includeUnavailable = options?.includeUnavailable ?? false;
  const query = supabase
    .from("menu_items")
    .select("*")
    .order("name", { ascending: true });

  const { data, error } = includeUnavailable
    ? await query
    : await query.eq("available", true);

  if (error) {
    throw new Error(`Error al consultar menú: ${error.message}`);
  }

  return (data ?? []).map(fromRow);
}

export async function fetchAionDishById(id: string): Promise<AionDish | null> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!error && data) {
    return fromRow(data);
  }

  if (error) {
    throw new Error(`Error al consultar plato: ${error.message}`);
  }

  return null;
}
