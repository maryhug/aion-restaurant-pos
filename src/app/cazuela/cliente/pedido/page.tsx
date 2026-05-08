"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCazuelaBranding } from "@/lib/cazuela/branding-context";
import {
  loadPreorderMeta,
  type PreorderMeta,
} from "@/lib/aion/preorder-storage";

type Phase = "recibido" | "cocina" | "listo" | "servido" | "cancelado";

const PHASE_LABELS: Record<Phase, string> = {
  recibido: "Recibido en cocina",
  cocina: "En preparación",
  listo: "Listo en barra de salida",
  servido: "En mesa / servido",
  cancelado: "Cancelado",
};

const PHASE_ORDER: Phase[] = ["recibido", "cocina", "listo", "servido"];

type OrderData = {
  id: string;
  phase: Phase;
  status: string;
  tableNumber: number | null;
  total: number;
  items: { name: string; quantity: number }[];
};

function CazuelaPedidoInner() {
  const t = useCazuelaBranding();
  const sp = useSearchParams();
  const refQ = sp.get("ref");

  const [meta] = useState<(PreorderMeta & { orderId?: string }) | null>(
    () => loadPreorderMeta() as (PreorderMeta & { orderId?: string }) | null,
  );
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  const validMeta = meta && (!refQ || meta.orderRef === refQ) ? meta : null;

  useEffect(() => {
    if (!validMeta?.orderId) return;
    const id = setInterval(() => setFetchTick((n) => n + 1), 10000);
    return () => clearInterval(id);
  }, [validMeta?.orderId]);

  useEffect(() => {
    if (!validMeta?.orderId) return;
    const orderId = validMeta.orderId;
    let cancelled = false;
    fetch(`/api/pedido?orderId=${orderId}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const d = (await res.json()) as { error?: string };
          if (!cancelled)
            setLoadError(d.error ?? "No se pudo obtener el estado");
          return;
        }
        const d = (await res.json()) as { order: OrderData };
        if (!cancelled) {
          setOrder(d.order);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("Error de red al consultar el pedido");
      });
    return () => {
      cancelled = true;
    };
  }, [validMeta?.orderId, fetchTick]);

  if (!validMeta) {
    return (
      <div
        className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6"
        style={{ background: t.colors.pageBg }}
      >
        <h1
          className="text-center text-lg font-extrabold"
          style={{ color: t.colors.text }}
        >
          Estado del pedido
        </h1>
        <p
          className="mt-2 text-center text-sm"
          style={{ color: t.colors.muted }}
        >
          Sin datos locales. Realiza una preorden primero.
        </p>
        <Link
          className="mt-4 block text-center text-sm font-bold"
          style={{ color: t.colors.primary }}
          href="/cazuela/cliente/menu"
        >
          Ir al menú
        </Link>
      </div>
    );
  }

  const phase: Phase = order?.phase ?? "recibido";
  const currentIdx = PHASE_ORDER.indexOf(phase);

  return (
    <div
      className="mx-auto min-h-dvh max-w-md px-4 py-5"
      style={{ background: t.colors.pageBg }}
    >
      <header className="mb-4 text-center">
        <Link
          className="float-left text-sm font-bold"
          style={{ color: t.colors.primary }}
          href="/cazuela"
        >
          Inicio
        </Link>
        <h1
          className="text-center text-base font-extrabold"
          style={{ color: t.colors.text }}
        >
          Tu pedido
        </h1>
      </header>

      <p className="text-sm" style={{ color: t.colors.muted }}>
        Código:{" "}
        <span
          className="font-mono font-bold"
          style={{ color: t.colors.primary }}
        >
          {validMeta.orderRef}
        </span>
      </p>

      {loadError && (
        <p className="mt-2 rounded-2xl bg-red-50 p-2 text-xs text-red-700">
          {loadError}
        </p>
      )}

      <div className="mt-4 space-y-3 rounded-2xl bg-white p-3 ring-1 ring-black/5">
        {PHASE_ORDER.map((k, i) => {
          const active = phase === k;
          const done = currentIdx > i;
          return (
            <div
              key={k}
              className="flex items-center justify-between border-b border-stone-100 pb-2 last:border-0"
            >
              <span
                className="text-sm font-bold"
                style={
                  active
                    ? { color: t.colors.primary }
                    : done
                      ? { color: t.colors.success }
                      : { color: t.colors.muted }
                }
              >
                {i + 1}. {PHASE_LABELS[k]}
              </span>
              {active ? (
                <span className="text-base">⟶</span>
              ) : done ? (
                <span className="text-base text-emerald-500">✓</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <p
        className="mt-3 rounded-2xl bg-stone-100/80 p-2 text-center text-sm"
        style={{ color: t.colors.muted }}
      >
        Llegada:{" "}
        <strong style={{ color: t.colors.text }}>{validMeta.date}</strong> a las{" "}
        <strong style={{ color: t.colors.text }}>{validMeta.time}</strong>
        {order && (
          <>
            {" "}
            · Mesa{" "}
            <strong style={{ color: t.colors.text }}>
              {order.tableNumber ?? "—"}
            </strong>
          </>
        )}
      </p>

      {!validMeta.orderId && (
        <p className="mt-3 rounded-2xl bg-amber-50 p-2 text-center text-xs text-amber-800">
          Estado en tiempo real no disponible para esta preorden.
        </p>
      )}

      <button
        type="button"
        onClick={() => setFetchTick((n) => n + 1)}
        className="mt-4 w-full rounded-2xl py-2 text-sm font-bold"
        style={{ background: t.colors.pillInactive, color: t.colors.text }}
        disabled={!validMeta.orderId}
      >
        Actualizar estado
      </button>
    </div>
  );
}

export default function CazuelaPedidoPage() {
  const t = useCazuelaBranding();
  return (
    <Suspense
      fallback={
        <div
          className="min-h-dvh p-4 text-sm"
          style={{ background: t.colors.pageBg, color: t.colors.muted }}
        >
          Cargando estado...
        </div>
      }
    >
      <CazuelaPedidoInner />
    </Suspense>
  );
}
