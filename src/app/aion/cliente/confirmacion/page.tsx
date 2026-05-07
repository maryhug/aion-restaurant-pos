"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { formatCOP } from "@/lib/aion/currency";
import { aion } from "@/lib/aion/tokens";
import {
  loadPreorderMeta,
  type PreorderMeta,
} from "@/lib/aion/preorder-storage";

type View = "load" | "ok" | "mismatch" | "missing";

function formatD(d: string) {
  const x = new Date(`${d}T00:00:00`);
  return x.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function AionConfirmacionInner() {
  const sp = useSearchParams();
  const refParam = sp.get("ref");
  const resolved = useMemo((): { view: View; data: PreorderMeta | null } => {
    const m = loadPreorderMeta();
    if (!m) return { view: "missing", data: null };
    if (refParam && m.orderRef !== refParam)
      return { view: "mismatch", data: null };
    return { view: "ok", data: m };
  }, [refParam]);
  const { view, data } = resolved;

  if (view === "load") {
    return (
      <div
        className="flex min-h-dvh items-center justify-center p-4 text-sm"
        style={{ background: aion.colors.pageBg, color: aion.colors.muted }}
      >
        Cargando confirmación…
      </div>
    );
  }

  if (view === "missing") {
    return (
      <div
        className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6"
        style={{ background: aion.colors.pageBg }}
      >
        <p className="text-center text-sm" style={{ color: aion.colors.muted }}>
          No hay un pedido reciente en este dispositivo.{" "}
          <Link
            className="font-bold"
            style={{ color: aion.colors.primary }}
            href="/aion/cliente/menu"
          >
            Ir al menú
          </Link>
        </p>
      </div>
    );
  }

  if (view === "mismatch") {
    return (
      <div
        className="mx-auto min-h-dvh max-w-lg p-4"
        style={{ background: aion.colors.pageBg }}
      >
        <p className="text-sm text-red-700" role="alert">
          El enlace no coincide con el último pedido guardado aquí.
        </p>
        <Link
          className="mt-4 block text-sm font-bold"
          style={{ color: aion.colors.primary }}
          href="/aion/cliente/pedido"
        >
          Abrir estado de pedido
        </Link>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div
      className="mx-auto max-w-lg px-4 py-6"
      style={{ background: aion.colors.pageBg, minHeight: "100dvh" }}
    >
      <h1
        className="text-center text-2xl font-extrabold"
        style={{ color: aion.colors.text }}
      >
        ¡Reserva y preorden confirmada!
      </h1>
      <p
        className="mt-1 text-center text-sm"
        style={{ color: aion.colors.muted }}
      >
        Código:{" "}
        <span
          className="font-mono text-base font-bold"
          style={{ color: aion.colors.primary }}
        >
          {data.orderRef}
        </span>
      </p>
      <div
        className="mt-5 space-y-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-black/5"
        style={{ color: aion.colors.text }}
      >
        <p>
          <strong>Para:</strong> {data.name} · {data.email}
        </p>
        <p>
          <strong>Llegada:</strong> {formatD(data.date)} a las {data.time}
        </p>
        <p>
          <strong>Comensales:</strong> {data.partySize}
        </p>
        <p className="pt-1 font-semibold">Tu preorden</p>
        <ul
          className="list-none space-y-1"
          style={{ color: aion.colors.muted }}
        >
          {data.lines.map((l) => (
            <li key={l.dishId} className="flex justify-between gap-2 text-sm">
              <span>
                {l.quantity}× {l.name}
              </span>
              <span>{formatCOP(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <p
          className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold"
          style={{ color: aion.colors.primary }}
        >
          <span>Total</span>
          <span>{formatCOP(data.subtotal)}</span>
        </p>
      </div>
      <p
        className="mt-3 text-center text-xs"
        style={{ color: aion.colors.muted }}
      >
        Sigue el estado de preparación en el restaurante o aquí.
      </p>
      <Link
        className="mt-5 block w-full rounded-2xl py-3 text-center text-sm font-bold text-white"
        style={{ background: aion.colors.primary }}
        href={`/aion/cliente/pedido?ref=${encodeURIComponent(data.orderRef)}`}
      >
        Ver estado del pedido
      </Link>
      <Link
        className="mt-3 block text-center text-sm font-medium"
        style={{ color: aion.colors.primary }}
        href="/aion"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

export default function AionConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-dvh items-center justify-center p-4 text-sm"
          style={{ background: aion.colors.pageBg, color: aion.colors.muted }}
        >
          Cargando confirmación...
        </div>
      }
    >
      <AionConfirmacionInner />
    </Suspense>
  );
}
