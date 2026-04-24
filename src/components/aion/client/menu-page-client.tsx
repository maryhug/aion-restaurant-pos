"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { aion } from "@/lib/aion/tokens";
import type { AionCategoryId, AionDish } from "@/lib/aion/types";
import { aionCategoryLabels } from "@/data/aion-dishes";
import { AionMenuCard } from "@/components/aion/client/menu-card";
import { IconBag, IconSearch } from "@/components/aion/icons";
import { useAionCart } from "@/components/aion/providers/cart-state";

const categories: { id: AionCategoryId; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "entradas", label: "Entradas" },
  { id: "principales", label: "Principales" },
  { id: "pastas", label: "Pastas" },
  { id: "carnes", label: "Carnes" },
  { id: "mariscos", label: "Mariscos" },
  { id: "postres", label: "Postres" },
  { id: "bebidas", label: "Bebidas" },
];

export function AionMenuPageClient({ dishes }: { dishes: AionDish[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<AionCategoryId>("todos");
  const { lineCount } = useAionCart();

  const list = useMemo(() => {
    return dishes.filter((d) => {
      const inCat = cat === "todos" || d.category === cat;
      if (!q.trim()) return inCat;
      const n = q.trim().toLowerCase();
      const inText =
        d.name.toLowerCase().includes(n) ||
        d.description.toLowerCase().includes(n);
      return inCat && inText;
    });
  }, [dishes, q, cat]);

  return (
    <div
      className="pb-8"
      style={{ background: aion.colors.pageBg, minHeight: "100dvh" }}
    >
      <header className="flex items-center justify-between px-4 py-3">
        <Link
          href="/aion"
          className="text-base font-extrabold tracking-wide"
          style={{ color: aion.colors.primary }}
        >
          AION
        </Link>
        <Link
          href="/aion/cliente/carrito"
          className="relative grid h-9 w-9 place-items-center text-stone-800"
          aria-label="Abrir carrito"
        >
          <IconBag />
          {lineCount > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full px-1 text-center text-[10px] font-bold text-white"
              style={{ background: aion.colors.primary }}
            >
              {lineCount > 99 ? "99+" : lineCount}
            </span>
          ) : null}
        </Link>
      </header>

      <div className="px-4">
        <div className="relative">
          <IconSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            size={18}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-2xl border-0 py-2.5 pl-10 pr-3 text-sm shadow-sm ring-1 ring-black/5"
            style={{ background: aion.colors.white, color: aion.colors.text }}
            placeholder="Buscar platos.."
            type="search"
            autoComplete="off"
          />
        </div>
      </div>

      <div
        className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Categorías"
      >
        {categories.map((c) => {
          const active = cat === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCat(c.id)}
              className="shrink-0 rounded-2xl px-3.5 py-1.5 text-sm font-medium transition"
              style={
                active
                  ? { background: aion.colors.primary, color: aion.colors.white }
                  : { background: aion.colors.pillInactive, color: aion.colors.text }
              }
            >
              {c.id === "todos" ? c.label : aionCategoryLabels[c.id]}
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p
          className="px-4 py-6 text-center text-sm"
          style={{ color: aion.colors.muted }}
        >
          {q.trim() ? "Sin resultados" : "No hay platos en esta categoría"}
        </p>
      ) : (
        <ul className="mt-2 flex list-none flex-col gap-2.5 px-4" aria-live="polite">
          {list.map((d) => (
            <li key={d.id}>
              <AionMenuCard dish={d} hrefDetail={`/aion/cliente/plato/${d.id}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
