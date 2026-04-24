"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { formatCOP } from "@/lib/aion/currency";
import { aion } from "@/lib/aion/tokens";
import { useAionCart } from "@/components/aion/providers/cart-state";
import { savePreorderMeta, type PreorderMeta } from "@/lib/aion/preorder-storage";

type FieldErrors = Partial<Record<"name" | "email" | "date" | "time", string>>;

function validate(
  p: Pick<PreorderMeta, "name" | "email" | "date" | "time" | "partySize">,
): FieldErrors {
  const e: FieldErrors = {};
  if (!p.name.trim()) e.name = "Obligatorio";
  if (!p.email.trim()) e.email = "Obligatorio";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) e.email = "Email no válido";
  if (!p.date) e.date = "Obligatorio";
  if (!p.time) e.time = "Obligatorio";
  return e;
}

export default function AionReservaHoraPage() {
  const { items, subtotal, clear, lineCount } = useAionCart();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [err, setErr] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (lineCount === 0) {
      setFormError("Añade platos a tu preorden para continuar.");
      return;
    }
    setFormError(null);
    const errors = validate({ name, email, date, time, partySize });
    if (Object.keys(errors).length > 0) {
      setErr(errors);
      return;
    }
    setErr({});
    setSaving(true);
    const orderRef = `AION-${Date.now().toString(36).toUpperCase()}`;
    const lines = items.map((l) => ({
      dishId: l.dishId,
      name: l.name,
      quantity: l.quantity,
      lineTotal: l.unitPrice * l.quantity,
    }));
    const data: PreorderMeta = {
      name: name.trim(),
      email: email.trim(),
      date,
      time,
      partySize,
      orderRef,
      createdAt: new Date().toISOString(),
      lines,
      subtotal: lines.reduce((s, li) => s + li.lineTotal, 0),
    };
    try {
      savePreorderMeta(data);
      clear();
      router.push(
        `/aion/cliente/confirmacion?ref=${encodeURIComponent(orderRef)}`,
      );
    } catch {
      setFormError("No se pudo guardar. Revisa el almacenamiento del navegador.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="mx-auto min-h-dvh max-w-lg px-4 pb-10 pt-2"
      style={{ background: aion.colors.pageBg }}
    >
      <header className="py-3 text-center">
        <Link
          className="float-left text-sm font-medium"
          style={{ color: aion.colors.primary }}
          href="/aion/cliente/carrito"
        >
          ←
        </Link>
        <h1 className="text-base font-bold" style={{ color: aion.colors.text }}>
          Fecha y hora
        </h1>
      </header>
      {lineCount === 0 ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          No hay platos en la preorden. Vuelve al carrito o al menú.
        </p>
      ) : null}
      {lineCount === 0 ? (
        <Link
          href="/aion/cliente/menu"
          className="mt-4 inline-block text-sm font-semibold"
          style={{ color: aion.colors.primary }}
        >
          Ir al menú
        </Link>
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label
            className="mb-1 block text-xs font-medium"
            style={{ color: aion.colors.muted }}
            htmlFor="aion-name"
          >
            Nombre para la reserva
          </label>
          <input
            id="aion-name"
            className="w-full rounded-2xl border-0 py-2.5 px-3 text-sm ring-1 ring-black/10"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErr((o) => ({ ...o, name: undefined }));
            }}
            autoComplete="name"
          />
          {err.name ? <p className="mt-1 text-xs text-red-600">{err.name}</p> : null}
        </div>
        <div>
          <label
            className="mb-1 block text-xs font-medium"
            style={{ color: aion.colors.muted }}
            htmlFor="aion-email"
          >
            Email
          </label>
          <input
            id="aion-email"
            className="w-full rounded-2xl border-0 py-2.5 px-3 text-sm ring-1 ring-black/10"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErr((o) => ({ ...o, email: undefined }));
            }}
            autoComplete="email"
          />
          {err.email ? <p className="mt-1 text-xs text-red-600">{err.email}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: aion.colors.muted }}
              htmlFor="aion-date"
            >
              Fecha
            </label>
            <input
              id="aion-date"
              className="w-full rounded-2xl border-0 py-2.5 px-2 text-sm ring-1 ring-black/10"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErr((o) => ({ ...o, date: undefined }));
              }}
            />
            {err.date ? <p className="mt-1 text-xs text-red-600">{err.date}</p> : null}
          </div>
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: aion.colors.muted }}
              htmlFor="aion-time"
            >
              Hora
            </label>
            <input
              id="aion-time"
              className="w-full rounded-2xl border-0 py-2.5 px-2 text-sm ring-1 ring-black/10"
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setErr((o) => ({ ...o, time: undefined }));
              }}
            />
            {err.time ? <p className="mt-1 text-xs text-red-600">{err.time}</p> : null}
          </div>
        </div>
        <div>
          <label
            className="mb-1 block text-xs font-medium"
            style={{ color: aion.colors.muted }}
            htmlFor="aion-party"
          >
            Comensales
          </label>
          <input
            id="aion-party"
            className="w-full rounded-2xl border-0 py-2.5 px-3 text-sm ring-1 ring-black/10"
            type="number"
            min={1}
            max={20}
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
          />
        </div>
        {lineCount > 0 ? (
          <p className="rounded-2xl bg-white p-3 text-sm ring-1 ring-black/5">
            <span style={{ color: aion.colors.muted }}>Total estimado</span>{" "}
            <span className="float-right font-bold" style={{ color: aion.colors.primary }}>
              {formatCOP(subtotal)}
            </span>
          </p>
        ) : null}
        {formError ? (
          <p className="text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}
        {lineCount > 0 ? (
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: aion.colors.primary }}
          >
            {saving ? "Enviando…" : "Confirmar reserva y preorden"}
          </button>
        ) : null}
      </form>
    </div>
  );
}
