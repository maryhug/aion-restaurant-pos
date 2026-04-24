"use client";

import Link from "next/link";
import { aion } from "@/lib/aion/tokens";
import { formatCOP } from "@/lib/aion/currency";
import type { AionDish } from "@/lib/aion/types";
import { AionDishThumbnail } from "../ui/aion-dish-thumbnail";
import { AionDietaryBadge } from "../ui/badge";
import { IconClock, IconPlus } from "../icons";
import { useAionCartOptional } from "../providers/cart-state";

type Props = { dish: AionDish; hrefDetail: string };

export function AionMenuCard({ dish, hrefDetail }: Props) {
  const cart = useAionCartOptional();
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
      <Link href={hrefDetail} className="shrink-0">
        <AionDishThumbnail label={dish.name} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={hrefDetail} className="block">
          <h3
            className="text-[15px] font-semibold leading-tight"
            style={{ color: aion.colors.text }}
          >
            {dish.name}
          </h3>
        </Link>
        <p
          className="mt-1 line-clamp-2 text-xs leading-relaxed"
          style={{ color: aion.colors.muted }}
        >
          {dish.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className="inline-flex items-center gap-1"
            style={{ color: aion.colors.muted }}
          >
            <IconClock className="text-stone-500" size={14} />
            {dish.prepMinutes} min
          </span>
          {dish.tags.map((t) => (
            <AionDietaryBadge key={t}>{t}</AionDietaryBadge>
          ))}
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <span
            className="text-sm font-bold"
            style={{ color: aion.colors.primary }}
          >
            {formatCOP(dish.price)}
          </span>
        </div>
      </div>
      <div className="shrink-0 self-end">
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
          className="grid size-10 place-items-center rounded-xl text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: aion.colors.primary }}
          aria-label={`Añadir ${dish.name}`}
        >
          <IconPlus className="text-white" size={20} />
        </button>
      </div>
    </div>
  );
}
