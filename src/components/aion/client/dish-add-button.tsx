"use client";

import { aion } from "@/lib/aion/tokens";
import { IconPlus } from "../icons";
import { useAionCart } from "../providers/cart-state";

type Props = {
  dishId: string;
  dishName: string;
  dishPrice: number;
  available: boolean;
  label: string;
};

export function AionDishAddButton({
  dishId,
  dishName,
  dishPrice,
  available,
  label,
}: Props) {
  const { add } = useAionCart();
  return (
    <button
      type="button"
      disabled={!available}
      onClick={() =>
        add({ dishId, name: dishName, unitPrice: dishPrice }, 1)
      }
      className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: aion.colors.primary }}
    >
      <IconPlus className="text-white" size={20} />
      Añadir a preorden
      <span className="sr-only">{label}</span>
    </button>
  );
}
