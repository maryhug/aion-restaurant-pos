"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { aion as defaultTokens } from "@/lib/aion/tokens";
import type { TokenShape } from "@/lib/aion/token-types";
import type { MenuItem } from "@/types/database";
import { useAionOrder } from "@/lib/aion/order-context";

type Props = {
  menuItems: MenuItem[];
  restaurantId: string | null;
  basePath?: string;
  tokens?: TokenShape;
};

export function AionPreOrderClient({
  menuItems,
  restaurantId,
  basePath = "/aion",
  tokens = defaultTokens,
}: Props) {
  const aion = tokens;
  const router = useRouter();
  const { items, addMenuItem, removeItem, setOrderId } = useAionOrder();
  const [openSheet, setOpenSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

  async function confirmOrder() {
    if (!restaurantId || items.length === 0) {
      setError("No hay items para confirmar o falta restaurante.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          items: items.map((item) => ({
            menuItemId: item.menu_item_id,
            quantity: item.quantity,
            unitPrice: item.unit_price,
          })),
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "No se pudo confirmar la orden");
      }
      const data = (await res.json()) as { order: { id: string } };
      setOrderId(data.order.id);
      router.push(`${basePath}/cliente/estado-pedido/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-6"
      style={{ background: aion.colors.pageBg }}
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <Link
            href={`${basePath}/cliente/experiencia`}
            className="text-sm font-bold"
            style={{ color: aion.colors.primary }}
          >
            ← Volver
          </Link>
          <h1
            className="mt-2 text-2xl font-black"
            style={{ color: aion.colors.primary }}
          >
            Pre-orden
          </h1>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-sm" style={{ color: aion.colors.muted }}>
            No tienes menú aceptado todavía.
          </p>
          <Link
            href={`${basePath}/cliente/experiencia`}
            className="mt-3 inline-block text-sm font-bold"
            style={{ color: aion.colors.primary }}
          >
            Ir a experiencia
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.menu_item_id}
              className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-black/5"
            >
              <div className="flex gap-3">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-stone-100">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-bold"
                    style={{ color: aion.colors.text }}
                  >
                    {item.name}
                  </p>
                  <span
                    className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: aion.colors.tagBg,
                      color: aion.colors.primary,
                    }}
                  >
                    {item.category}
                  </span>
                  <p
                    className="mt-1 text-sm font-extrabold"
                    style={{ color: aion.colors.primary }}
                  >
                    ${item.unit_price.toLocaleString("es-CO")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.menu_item_id)}
                  className="text-xs font-bold"
                  style={{ color: aion.colors.danger }}
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <button
          type="button"
          onClick={() => setOpenSheet(true)}
          className="w-full rounded-2xl py-2.5 text-sm font-bold transition-all duration-300 ease-in-out"
          style={{
            background: aion.colors.pillInactive,
            color: aion.colors.text,
          }}
        >
          + Agregar más platos
        </button>
        <div className="mt-3 flex items-center justify-between">
          <p
            className="text-sm font-semibold"
            style={{ color: aion.colors.muted }}
          >
            Total acumulado
          </p>
          <p
            className="text-lg font-black"
            style={{ color: aion.colors.primary }}
          >
            ${total.toLocaleString("es-CO")}
          </p>
        </div>
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        <button
          type="button"
          disabled={saving || items.length === 0}
          onClick={() => void confirmOrder()}
          className="mt-3 w-full rounded-2xl py-3 text-sm font-bold text-white transition-all duration-300 ease-in-out disabled:opacity-50"
          style={{ background: aion.colors.primary }}
        >
          {saving ? "Confirmando..." : "Confirmar pedido"}
        </button>
      </div>

      {openSheet ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-auto rounded-t-3xl bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2
                className="text-lg font-extrabold"
                style={{ color: aion.colors.primary }}
              >
                Añadir platos
              </h2>
              <button
                type="button"
                onClick={() => setOpenSheet(false)}
                className="rounded-full px-3 py-1 text-sm font-bold"
                style={{
                  background: aion.colors.pillInactive,
                  color: aion.colors.text,
                }}
              >
                Cerrar
              </button>
            </div>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {menuItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-stone-100 p-3"
                >
                  <p className="text-sm font-bold">{item.name}</p>
                  <p className="text-xs" style={{ color: aion.colors.muted }}>
                    {item.category}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      ${Number(item.price).toLocaleString("es-CO")}
                    </span>
                    <button
                      type="button"
                      className="rounded-xl px-3 py-1 text-xs font-bold text-white"
                      style={{ background: aion.colors.primary }}
                      onClick={() => addMenuItem(item)}
                    >
                      Agregar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
