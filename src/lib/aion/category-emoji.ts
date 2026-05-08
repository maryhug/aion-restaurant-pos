const map: Record<string, string> = {
  "platos fuertes": "🍽️",
  sopas: "🍲",
  postres: "🍮",
  bebidas: "🥤",
  entradas: "🥗",
  ensaladas: "🥗",
  carnes: "🥩",
  sándwiches: "🥪",
  sandwiches: "🥪",
  cafés: "☕",
  cafes: "☕",
  cócteles: "🍹",
  cocteles: "🍹",
  cervezas: "🍺",
  smoothies: "🥤",
  vino: "🍷",
  sangría: "🍷",
  sangria: "🍷",
  adiciones: "➕",
};

export function categoryEmoji(category?: string | null): string {
  if (!category) return "🍴";
  return map[category.toLowerCase().trim()] ?? "🍴";
}
