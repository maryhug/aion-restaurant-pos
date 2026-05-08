"use client";

import Link from "next/link";
import { aion } from "@/lib/aion/tokens";
import { formatCOP } from "@/lib/aion/currency";
import type { AionDish } from "@/lib/aion/types";
import { categoryEmoji } from "@/lib/aion/category-emoji";
import { IconPlus } from "../icons";
import { useAionCartOptional } from "../providers/cart-state";

type Props = { dish: AionDish; hrefDetail: string };

const emojiByDishId: Record<string, string> = {
  carpaccio: "🥩",
  bruschetta: "🍅",
  cesar: "🥗",
  risotto: "🍚",
  pollo: "🍗",
  fettuccine: "🍝",
  bolognese: "🍝",
  filete: "🥩",
  costillas: "🍖",
  salmon: "🐟",
  camarones: "🍤",
  tiramisu: "🍰",
  vino: "🍷",
  limonada: "🍋",
  cafe: "☕",
};

function dishEmoji(dish: AionDish): string {
  const byId = emojiByDishId[dish.id.toLowerCase()];
  if (byId) return byId;

  const text = `${dish.name} ${dish.description ?? ""}`.toLowerCase();
  if (/café|coffee|latte|expresso|americano|capuccino|capuchino/.test(text))
    return "☕";
  if (/vino|sangria|sangría/.test(text)) return "🍷";
  if (/coctel|cóctel|mojito|margarita/.test(text)) return "🍹";
  if (/cerveza/.test(text)) return "🍺";
  if (/smoothie|batido|frappe|frapuchino|jugo/.test(text)) return "🥤";
  if (/postre|torta|pastel|helado|brownie/.test(text)) return "🍰";
  if (/sandwich|sándwich/.test(text)) return "🥪";
  if (/ensalada/.test(text)) return "🥗";
  if (/carne|res|cerdo|pollo|brocheta|pechuga/.test(text)) return "🥩";
  if (/sopa|caldo/.test(text)) return "🍲";
  if (/maiz|maíz|adicion|adición|acompañante/.test(text)) return "🍽️";
  return categoryEmoji(dish.category);
}

export function AionMenuCard({ dish, hrefDetail }: Props) {
  const cart = useAionCartOptional();
  const emoji = dishEmoji(dish);
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/[0.04]">
      <Link href={hrefDetail} className="block">
        <div className="grid h-36 w-full place-items-center bg-gradient-to-br from-stone-200/90 to-amber-100/80">
          <span className="text-5xl" aria-hidden>
            {emoji}
          </span>
          <span className="sr-only">{dish.name}</span>
        </div>
      </Link>
      <div className="p-3">
        <Link href={hrefDetail} className="block">
          <h3
            className="line-clamp-2 text-sm font-extrabold leading-tight"
            style={{ color: aion.colors.text }}
          >
            {dish.name}
          </h3>
        </Link>
        <p
          className="mt-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: aion.colors.primaryAlt }}
        >
          {dish.category}
        </p>
        {dish.sabor && (
          <div className="mt-1 flex flex-wrap gap-1">
            {dish.sabor
              .split(",")
              .slice(0, 2)
              .map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700"
                >
                  {s.trim()}
                </span>
              ))}
          </div>
        )}
        {dish.ingredientes && (
          <p className="mt-0.5 line-clamp-1 text-[10px] text-stone-400">
            {dish.ingredientes}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className="text-sm font-extrabold"
            style={{ color: aion.colors.primary }}
          >
            {formatCOP(dish.price)}
          </span>
          <button
            type="button"
            disabled={!dish.available}
            onClick={() => {
              if (!dish.available) return;
              cart?.add(
                { dishId: dish.id, name: dish.name, unitPrice: dish.price },
                1,
              );
            }}
            className="grid size-9 place-items-center rounded-xl text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: aion.colors.primary }}
            aria-label={`Añadir ${dish.name}`}
          >
            <IconPlus className="text-white" size={18} />
          </button>
        </div>
        {dish.recomendado_con && (
          <p className="mt-1.5 line-clamp-1 text-[10px] text-stone-400">
            Ideal con: {dish.recomendado_con}
          </p>
        )}
      </div>
    </article>
  );
}
