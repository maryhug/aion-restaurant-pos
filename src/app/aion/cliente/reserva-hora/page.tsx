"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import { formatCOP } from "@/lib/aion/currency";
import { aion } from "@/lib/aion/tokens";
import { useAionCart } from "@/components/aion/providers/cart-state";
import {
  savePreorderMeta,
  type PreorderMeta,
} from "@/lib/aion/preorder-storage";

type FieldErrors = Partial<
  Record<"name" | "email" | "date" | "time" | "table", string>
>;

type TableOption = { id: string; number: number; capacity: number };

function validate(
  p: Pick<PreorderMeta, "name" | "email" | "date" | "time" | "partySize">,
): FieldErrors {
  const e: FieldErrors = {};
  if (!p.name.trim()) e.name = "Obligatorio";
  if (!p.email.trim()) e.email = "Obligatorio";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
    e.email = "Email no válido";
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
  const [tableId, setTableId] = useState("");
  const [tables, setTables] = useState<TableOption[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesSearched, setTablesSearched] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [err, setErr] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Obtener restaurantId al montar
  useEffect(() => {
    fetch("/api/restaurant")
      .then((r) => r.json())
      .then((d: { restaurant?: { id: string } }) => {
        if (d.restaurant?.id) setRestaurantId(d.restaurant.id);
      })
      .catch(() => {});
  }, []);

  async function searchTables() {
    if (!restaurantId || !date || !time) return;
    setTablesLoading(true);
    setTablesSearched(false);
    setTableId("");
    try {
      const res = await fetch(
        `/api/reservas/mesas?restaurantId=${restaurantId}&date=${date}&time=${encodeURIComponent(time)}&partySize=${partySize}`,
      );
      const data = (await res.json()) as { tables?: TableOption[] };
      setTables(data.tables ?? []);
      setTablesSearched(true);
    } catch {
      setFormError("No se pudo buscar mesas disponibles.");
    } finally {
      setTablesLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (lineCount === 0) {
      setFormError("Añade platos a tu preorden para continuar.");
      return;
    }
    setFormError(null);
    const errors = validate({ name, email, date, time, partySize });
    if (!tableId) errors.table = "Selecciona una mesa";
    if (Object.keys(errors).length > 0) {
      setErr(errors);
      return;
    }
    setErr({});
    setSaving(true);

    try {
      // 1. Crear reserva en la BD
      const resRes = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableId,
          date,
          time,
          partySize,
          name,
          email,
        }),
      });
      if (!resRes.ok) {
        const d = (await resRes.json()) as { error?: string };
        throw new Error(d.error ?? "No se pudo crear la reserva");
      }

      // 2. Crear orden en la BD con los ítems del carrito
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableId,
          items: items.map((i) => ({
            menuItemId: i.dishId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });
      if (!orderRes.ok) {
        const d = (await orderRes.json()) as { error?: string };
        throw new Error(d.error ?? "No se pudo registrar la orden");
      }
      const orderData = (await orderRes.json()) as { order: { id: string } };
      const orderId = orderData.order.id;

      // 3. Guardar en sessionStorage (incluye orderId para el seguimiento)
      const orderRef = `AION-${Date.now().toString(36).toUpperCase()}`;
      const lines = items.map((l) => ({
        dishId: l.dishId,
        name: l.name,
        quantity: l.quantity,
        lineTotal: l.unitPrice * l.quantity,
      }));
      const meta: PreorderMeta & { orderId?: string } = {
        name: name.trim(),
        email: email.trim(),
        date,
        time,
        partySize,
        orderRef,
        createdAt: new Date().toISOString(),
        lines,
        subtotal: lines.reduce((s, l) => s + l.lineTotal, 0),
        orderId,
      };
      savePreorderMeta(meta as PreorderMeta);
      clear();
      router.push(
        `/aion/cliente/confirmacion?ref=${encodeURIComponent(orderRef)}`,
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Error al confirmar. Intenta de nuevo.",
      );
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
          Fecha, hora y mesa
        </h1>
      </header>

      {lineCount === 0 ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          No hay platos en la preorden.{" "}
          <Link
            href="/aion/cliente/menu"
            className="font-semibold"
            style={{ color: aion.colors.primary }}
          >
            Ir al menú
          </Link>
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        {/* Nombre */}
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
          {err.name ? (
            <p className="mt-1 text-xs text-red-600">{err.name}</p>
          ) : null}
        </div>

        {/* Email */}
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
          {err.email ? (
            <p className="mt-1 text-xs text-red-600">{err.email}</p>
          ) : null}
        </div>

        {/* Fecha / Hora / Personas */}
        <div className="grid grid-cols-3 gap-2">
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
                setTablesSearched(false);
              }}
            />
            {err.date ? (
              <p className="mt-1 text-xs text-red-600">{err.date}</p>
            ) : null}
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
                setTablesSearched(false);
              }}
            />
            {err.time ? (
              <p className="mt-1 text-xs text-red-600">{err.time}</p>
            ) : null}
          </div>
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: aion.colors.muted }}
              htmlFor="aion-party"
            >
              Personas
            </label>
            <input
              id="aion-party"
              className="w-full rounded-2xl border-0 py-2.5 px-2 text-sm ring-1 ring-black/10"
              type="number"
              min={1}
              max={20}
              value={partySize}
              onChange={(e) => {
                setPartySize(Number(e.target.value));
                setTablesSearched(false);
              }}
            />
          </div>
        </div>

        {/* Buscar mesas */}
        <button
          type="button"
          onClick={() => void searchTables()}
          disabled={tablesLoading || !date || !time}
          className="w-full rounded-2xl py-2.5 text-sm font-bold disabled:opacity-50"
          style={{
            background: aion.colors.pillInactive,
            color: aion.colors.text,
          }}
        >
          {tablesLoading ? "Buscando…" : "Ver mesas disponibles"}
        </button>

        {/* Resultados */}
        {tablesSearched && (
          <div>
            {tables.length === 0 ? (
              <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
                No hay mesas disponibles para esa fecha, hora y número de
                personas.
              </p>
            ) : (
              <div>
                <p
                  className="mb-2 text-xs font-medium"
                  style={{ color: aion.colors.muted }}
                >
                  Selecciona una mesa
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {tables.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTableId(t.id);
                        setErr((o) => ({ ...o, table: undefined }));
                      }}
                      className="rounded-2xl border p-2 text-sm font-medium transition"
                      style={
                        tableId === t.id
                          ? {
                              borderColor: aion.colors.primary,
                              background: "#FFF5F7",
                              color: aion.colors.primary,
                            }
                          : { borderColor: "#e7e5e4", color: aion.colors.text }
                      }
                    >
                      Mesa {t.number}
                      <span
                        className="block text-xs"
                        style={{ color: aion.colors.muted }}
                      >
                        {t.capacity} personas
                      </span>
                    </button>
                  ))}
                </div>
                {err.table ? (
                  <p className="mt-1 text-xs text-red-600">{err.table}</p>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Total */}
        {lineCount > 0 ? (
          <p className="rounded-2xl bg-white p-3 text-sm ring-1 ring-black/5">
            <span style={{ color: aion.colors.muted }}>Total estimado</span>{" "}
            <span
              className="float-right font-bold"
              style={{ color: aion.colors.primary }}
            >
              {formatCOP(subtotal)}
            </span>
          </p>
        ) : null}

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

        {lineCount > 0 ? (
          <button
            type="submit"
            disabled={saving || !tableId}
            className="w-full rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: aion.colors.primary }}
          >
            {saving ? "Confirmando…" : "Confirmar reserva y preorden"}
          </button>
        ) : null}
      </form>
    </div>
  );
}
