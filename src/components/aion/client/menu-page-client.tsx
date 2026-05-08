"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { aion } from "@/lib/aion/tokens";
import type { TokenShape } from "@/lib/aion/token-types";
import type { AionCategoryId, AionDish } from "@/lib/aion/types";
import { aionCategoryLabels } from "@/data/aion-dishes";
import { AionMenuCard } from "@/components/aion/client/menu-card";
import { IconBag, IconSearch } from "@/components/aion/icons";
import { useAionCart } from "@/components/aion/providers/cart-state";

const categories: { id: AionCategoryId; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "entradas", label: "Entradas" },
  { id: "ensaladas", label: "Ensaladas" },
  { id: "carnes", label: "Carnes" },
  { id: "adiciones", label: "Adiciones" },
  { id: "postres", label: "Postres" },
  { id: "bebidas", label: "Bebidas" },
  { id: "cafés", label: "Cafés" },
  { id: "cervezas", label: "Cervezas" },
  { id: "cócteles", label: "Cócteles" },
  { id: "vino", label: "Vino" },
  { id: "sangría", label: "Sangría" },
  { id: "smoothies", label: "Smoothies" },
  { id: "sándwiches", label: "Sándwiches" },
];

export function AionMenuPageClient({
  dishes,
  basePath = "/aion",
  tokens,
}: {
  dishes: AionDish[];
  basePath?: string;
  tokens?: TokenShape;
}) {
  const colors = tokens?.colors ?? aion.colors;
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
      style={{ background: colors.pageBg, minHeight: "100dvh" }}
    >
      <div className="mx-auto max-w-xl px-4">
        <header className="flex items-center justify-between pt-3">
          <Link
            href={basePath}
            className="grid size-8 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/5"
            aria-label="Volver"
          >
            ←
          </Link>
          <Link
            href={`${basePath}/cliente/carrito`}
            className="relative grid size-8 place-items-center rounded-full bg-white text-stone-800 shadow-sm ring-1 ring-black/5"
            aria-label="Abrir carrito"
          >
            <IconBag size={17} />
            {lineCount > 0 ? (
              <span
                className="absolute -right-1 -top-1 min-w-4 rounded-full px-1 text-center text-[10px] font-bold text-white"
                style={{ background: colors.primary }}
              >
                {lineCount > 99 ? "99+" : lineCount}
              </span>
            ) : null}
          </Link>
        </header>

        <h1
          className="mt-3 text-3xl font-black leading-none"
          style={{ color: colors.primary }}
        >
          Nuestro menú
        </h1>

        <div className="relative mt-3">
          <IconSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            size={16}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-2xl border-0 py-2.5 pl-9 pr-3 text-sm shadow-sm ring-1 ring-black/5"
            style={{ background: colors.white, color: colors.text }}
            placeholder="Buscar..."
            type="search"
            autoComplete="off"
          />
        </div>

        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300 ease-in-out"
                style={
                  active
                    ? {
                        background: colors.primary,
                        color: colors.white,
                      }
                    : {
                        background: colors.pillInactive,
                        color: colors.text,
                      }
                }
              >
                {c.id === "todos" ? c.label : aionCategoryLabels[c.id]}
              </button>
            );
          })}
        </div>
      </div>

      {list.length === 0 ? (
        <p
          className="px-4 py-6 text-center text-sm"
          style={{ color: colors.muted }}
        >
          {q.trim() ? "Sin resultados" : "No hay platos en esta categoría"}
        </p>
      ) : (
        <ul
          className="mx-auto mt-3 grid max-w-3xl list-none grid-cols-2 gap-3 px-4 sm:grid-cols-3"
          aria-live="polite"
        >
          {list.map((d) => (
            <li key={d.id}>
              <AionMenuCard
                dish={d}
                hrefDetail={`${basePath}/cliente/plato/${d.id}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
