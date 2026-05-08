"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { formatCOP } from "@/lib/aion/currency";
import { useCazuelaBranding } from "@/lib/cazuela/branding-context";
import {
  loadPreorderMeta,
  type PreorderMeta,
} from "@/lib/aion/preorder-storage";

type View = "load" | "ok" | "mismatch" | "missing";

function formatD(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function CazuelaConfirmacionInner() {
  const t = useCazuelaBranding();
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
        style={{ background: t.colors.pageBg, color: t.colors.muted }}
      >
        Cargando confirmación…
      </div>
    );
  }

  if (view === "missing") {
    return (
      <div
        className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6"
        style={{ background: t.colors.pageBg }}
      >
        <p className="text-center text-sm" style={{ color: t.colors.muted }}>
          No hay un pedido reciente en este dispositivo.{" "}
          <Link
            className="font-bold"
            style={{ color: t.colors.primary }}
            href="/cazuela/cliente/menu"
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
        style={{ background: t.colors.pageBg }}
      >
        <p className="text-sm text-red-700" role="alert">
          El enlace no coincide con el último pedido guardado aquí.
        </p>
        <Link
          className="mt-4 block text-sm font-bold"
          style={{ color: t.colors.primary }}
          href="/cazuela/cliente/pedido"
        >
          Abrir estado de pedido
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className="mx-auto max-w-lg px-4 py-6"
      style={{ background: t.colors.pageBg, minHeight: "100dvh" }}
    >
      <h1
        className="text-center text-2xl font-extrabold"
        style={{ color: t.colors.text }}
      >
        ¡Reserva y preorden confirmada!
      </h1>
      <p className="mt-1 text-center text-sm" style={{ color: t.colors.muted }}>
        Código:{" "}
        <span
          className="font-mono text-base font-bold"
          style={{ color: t.colors.primary }}
        >
          {data.orderRef}
        </span>
      </p>
      <div
        className="mt-5 space-y-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-black/5"
        style={{ color: t.colors.text }}
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
        <ul className="list-none space-y-1" style={{ color: t.colors.muted }}>
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
          style={{ color: t.colors.primary }}
        >
          <span>Total</span>
          <span>{formatCOP(data.subtotal)}</span>
        </p>
      </div>
      <p className="mt-3 text-center text-xs" style={{ color: t.colors.muted }}>
        Sigue el estado de preparación en el restaurante o aquí.
      </p>
      <Link
        className="mt-5 block w-full rounded-2xl py-3 text-center text-sm font-bold text-white"
        style={{ background: t.colors.primary }}
        href={`/cazuela/cliente/pedido?ref=${encodeURIComponent(data.orderRef)}`}
      >
        Ver estado del pedido
      </Link>
      <Link
        className="mt-3 block text-center text-sm font-medium"
        style={{ color: t.colors.primary }}
        href="/cazuela"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

export default function CazuelaConfirmacionPage() {
  const t = useCazuelaBranding();
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-dvh items-center justify-center p-4 text-sm"
          style={{ background: t.colors.pageBg, color: t.colors.muted }}
        >
          Cargando confirmación...
        </div>
      }
    >
      <CazuelaConfirmacionInner />
    </Suspense>
  );
}
