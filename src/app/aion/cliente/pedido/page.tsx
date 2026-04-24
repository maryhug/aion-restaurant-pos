"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { aion } from "@/lib/aion/tokens";
import { loadPreorderMeta, type PreorderMeta } from "@/lib/aion/preorder-storage";

type Phase = "recibido" | "cocina" | "listo" | "servido";

function usePhase(ref: string | null): { phase: Phase; eta: string; urgent: boolean } {
  // Demo: deterministic pseudo state from ref hash
  const t = (ref ?? "demo").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 4;
  const phases: Phase[] = ["recibido", "cocina", "listo", "servido"];
  const phase = phases[t] ?? "cocina";
  return {
    phase,
    eta: phase === "listo" || phase === "servido" ? "0–5 min" : "12 min",
    urgent: phase === "cocina",
  };
}

const labels: Record<Phase, string> = {
  recibido: "Recibido en cocina",
  cocina: "En preparación",
  listo: "Listo en barra de salida",
  servido: "En mesa / servido",
};

function AionPedidoEstadoInner() {
  const sp = useSearchParams();
  const refQ = sp.get("ref");
  const [m, setM] = useState<PreorderMeta | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const d = loadPreorderMeta();
    setM(d);
    if (d && refQ && d.orderRef !== refQ) {
      setM(null);
    }
    setOk(true);
  }, [refQ]);

  const { phase, eta, urgent } = usePhase(
    m?.orderRef ?? refQ ?? "demo",
  );

  if (!ok) {
    return (
      <div
        className="min-h-dvh p-4 text-sm"
        style={{ background: aion.colors.pageBg, color: aion.colors.muted }}
      />
    );
  }

  if (!m) {
    return (
      <div
        className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6"
        style={{ background: aion.colors.pageBg }}
      >
        <h1
          className="text-center text-lg font-extrabold"
          style={{ color: aion.colors.text }}
        >
          Pedido
        </h1>
        <p className="mt-2 text-center text-sm" style={{ color: aion.colors.muted }}>
          Sin datos locales. Tras reservar verás el estado con tu referencia.{" "}
        </p>
        <Link
          className="mt-4 block text-center text-sm font-bold"
          style={{ color: aion.colors.primary }}
          href="/aion/cliente/reserva-hora"
        >
          Ir a reservar
        </Link>
      </div>
    );
  }

  return (
    <div
      className="mx-auto min-h-dvh max-w-md px-4 py-5"
      style={{ background: aion.colors.pageBg }}
    >
      <header className="mb-4 text-center">
        <Link
          className="float-left text-sm font-bold"
          style={{ color: aion.colors.primary }}
          href="/aion"
        >
          Inicio
        </Link>
        <h1
          className="text-center text-base font-extrabold"
          style={{ color: aion.colors.text }}
        >
          Tu pedido
        </h1>
      </header>
      {urgent ? (
        <p
          className="mb-2 rounded-2xl border p-2 text-center text-sm font-bold"
          style={{ borderColor: aion.colors.danger, color: aion.colors.danger }}
        >
          Cocina con prioridad — te avisaremos
        </p>
      ) : null}
      <p className="text-sm" style={{ color: aion.colors.muted }}>
        Código:{" "}
        <span className="font-mono font-bold" style={{ color: aion.colors.primary }}>
          {m.orderRef}
        </span>
      </p>
      <div
        className="mt-4 space-y-3 rounded-2xl bg-white p-3 ring-1 ring-black/5"
        style={{ color: aion.colors.text }}
      >
        {(["recibido", "cocina", "listo", "servido"] as const).map((k, i) => {
          const active = phase === k;
          return (
            <div
              key={k}
              className="flex items-center justify-between border-b border-stone-100 pb-2 last:border-0"
            >
              <span
                className="text-sm font-bold"
                style={active ? { color: aion.colors.primary } : { color: aion.colors.muted }}
              >
                {i + 1}. {labels[k]}
              </span>
              {active ? <span className="text-lg">⟶</span> : null}
            </div>
          );
        })}
      </div>
      <p
        className="mt-3 rounded-2xl bg-stone-100/80 p-2 text-center text-sm"
        style={{ color: aion.colors.muted }}
      >
        Llegada programada: {m.date} · {m.time} — ETA aprox. <strong style={{ color: aion.colors.text }}>{eta}</strong>
      </p>
    </div>
  );
}

export default function AionPedidoEstadoPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-dvh p-4 text-sm"
          style={{ background: aion.colors.pageBg, color: aion.colors.muted }}
        >
          Cargando estado...
        </div>
      }
    >
      <AionPedidoEstadoInner />
    </Suspense>
  );
}
