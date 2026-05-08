"use client";

import Link from "next/link";
import { useState } from "react";
import { aion as defaultTokens } from "@/lib/aion/tokens";
import type { TokenShape } from "@/lib/aion/token-types";
import { formatCOP } from "@/lib/aion/currency";
import type { AionDish } from "@/lib/aion/types";
import { categoryEmoji } from "@/lib/aion/category-emoji";
import { IconPlus } from "../icons";
import { useAionCartOptional } from "../providers/cart-state";

type Props = { dish: AionDish; hrefDetail: string; tokens?: TokenShape };

export function AionMenuCard({
  dish,
  hrefDetail,
  tokens = defaultTokens,
}: Props) {
  const aion = tokens;
  const cart = useAionCartOptional();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!dish.available) return;
    cart?.add(
      {
        dishId: dish.id,
        name: dish.name,
        unitPrice: dish.price,
        category: dish.category,
      },
      1,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/[0.04]">
      <Link href={hrefDetail} className="block">
        <div
          className="flex h-36 w-full flex-col items-center justify-center gap-1"
          style={{
            background: `linear-gradient(135deg, ${aion.colors.tagBg} 0%, ${aion.colors.pageBgAlt} 100%)`,
          }}
        >
          <span className="text-4xl leading-none" role="img" aria-hidden>
            {categoryEmoji(dish.category)}
          </span>
          <span
            className="line-clamp-1 px-3 text-center text-[11px] font-semibold"
            style={{ color: aion.colors.primary }}
          >
            {dish.name}
          </span>
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
            onClick={handleAdd}
            className="grid size-9 place-items-center rounded-xl text-white shadow-sm transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: added ? "#5AE88F" : aion.colors.primary }}
            aria-label={`Añadir ${dish.name}`}
          >
            {added ? (
              <span className="text-base font-bold leading-none">✓</span>
            ) : (
              <IconPlus className="text-white" size={18} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
