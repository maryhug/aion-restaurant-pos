"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { aion as defaultTokens } from "@/lib/aion/tokens";
import type { TokenShape } from "@/lib/aion/token-types";
import type { OrderStatus } from "@/types/database";

type ApiOrder = {
  id: string;
  status: OrderStatus;
  total: number;
  items: { id: string; quantity: number; unit_price: number; name: string }[];
};

const states: OrderStatus[] = ["pending", "preparing", "ready", "delivered"];

type Props = { orderId: string; basePath?: string; tokens?: TokenShape };

export function AionOrderStatusClient({
  orderId,
  basePath = "/aion",
  tokens = defaultTokens,
}: Props) {
  const aion = tokens;
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "No se pudo cargar la orden");
        }
        const data = (await res.json()) as { order: ApiOrder };
        if (active) {
          setOrder(data.order);
          setError(null);
        }
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : "Error de red");
      }
    }
    void fetchOrder();
    const id = setInterval(fetchOrder, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [orderId]);

  const currentIndex = useMemo(
    () => states.indexOf(order?.status ?? "pending"),
    [order?.status],
  );

  return (
    <div
      className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-6"
      style={{ background: aion.colors.pageBg }}
    >
      <header className="mb-4">
        <Link
          href={basePath}
          className="text-sm font-bold"
          style={{ color: aion.colors.primary }}
        >
          ← Inicio
        </Link>
        <h1
          className="mt-2 text-2xl font-black"
          style={{ color: aion.colors.primary }}
        >
          Estado del pedido
        </h1>
        <p
          className="text-xs font-semibold"
          style={{ color: aion.colors.muted }}
        >
          Orden: {orderId}
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        {order?.status === "cancelled" ? (
          <p className="rounded-2xl bg-red-100 p-3 text-sm font-bold text-red-700">
            Pedido cancelado
          </p>
        ) : (
          <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {states.map((state, index) => {
              const active = index === currentIndex;
              const done = index < currentIndex;
              return (
                <li key={state} className="flex items-center gap-2">
                  <span
                    className={`inline-block size-3 rounded-full ${active ? "animate-pulse" : ""}`}
                    style={{
                      background:
                        active || done
                          ? aion.colors.primary
                          : aion.colors.border,
                    }}
                  />
                  <span
                    className="text-sm font-semibold capitalize"
                    style={{
                      color:
                        active || done
                          ? aion.colors.primary
                          : aion.colors.muted,
                    }}
                  >
                    {state}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <h2
          className="text-base font-extrabold"
          style={{ color: aion.colors.primary }}
        >
          Items del pedido
        </h2>
        <ul className="mt-2 space-y-2">
          {order?.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2"
            >
              <span className="text-sm font-semibold">
                {item.quantity}x {item.name}
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: aion.colors.primary }}
              >
                ${(item.quantity * item.unit_price).toLocaleString("es-CO")}
              </span>
            </li>
          )) ?? <li className="text-sm text-stone-500">Cargando items...</li>}
        </ul>
      </div>
    </div>
  );
}
