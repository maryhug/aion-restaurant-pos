"use client";

import { useState } from "react";
import { aion } from "@/lib/aion/tokens";
import type { TokenShape } from "@/lib/aion/token-types";
import { IconPlus } from "../icons";
import { useAionCart } from "../providers/cart-state";

type Props = {
  dishId: string;
  dishName: string;
  dishPrice: number;
  dishCategory?: string;
  available: boolean;
  label: string;
  tokens?: TokenShape;
};

export function AionDishAddButton({
  dishId,
  dishName,
  dishPrice,
  dishCategory,
  available,
  label,
  tokens = aion,
}: Props) {
  const { add } = useAionCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(
      { dishId, name: dishName, unitPrice: dishPrice, category: dishCategory },
      1,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      type="button"
      disabled={!available}
      onClick={handleAdd}
      className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: added ? "#16a34a" : tokens.colors.primary }}
      aria-label={label}
    >
      {added ? (
        <>
          <span className="text-base leading-none">✓</span>
          Producto agregado
        </>
      ) : (
        <>
          <IconPlus className="text-white" size={20} />
          Añadir a preorden
        </>
      )}
    </button>
  );
}
