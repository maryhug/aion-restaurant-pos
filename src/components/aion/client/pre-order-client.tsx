"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { aion } from "@/lib/aion/tokens";
import type { MenuItem } from "@/types/database";
import { useAionOrder } from "@/lib/aion/order-context";
import {
  savePreorderMeta,
  type PreorderMeta,
} from "@/lib/aion/preorder-storage";

type Props = {
  menuItems: MenuItem[];
  restaurantId: string | null;
};

type Phase = "review" | "checkout";
type TableOption = { id: string; number: number; capacity: number };
type FieldErrors = Partial<
  Record<"name" | "email" | "date" | "time" | "table", string>
>;

function validate(p: {
  name: string;
  email: string;
  date: string;
  time: string;
}): FieldErrors {
  const e: FieldErrors = {};
  if (!p.name.trim()) e.name = "Obligatorio";
  if (!p.email.trim()) e.email = "Obligatorio";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
    e.email = "Email no válido";
  if (!p.date) e.date = "Obligatorio";
  if (!p.time) e.time = "Obligatorio";
  return e;
}

export function AionPreOrderClient({ menuItems, restaurantId }: Props) {
  const router = useRouter();
  const { items, addMenuItem, removeItem } = useAionOrder();
  const [phase, setPhase] = useState<Phase>("review");
  const [openSheet, setOpenSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // checkout form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [tableId, setTableId] = useState("");
  const [tables, setTables] = useState<TableOption[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesSearched, setTablesSearched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const total = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

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
      setError("No se pudo buscar mesas disponibles.");
    } finally {
      setTablesLoading(false);
    }
  }

  async function handleCheckoutSubmit(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setError(null);
    const errors = validate({ name, email, date, time });
    if (!tableId) errors.table = "Selecciona una mesa";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);

    try {
      // 1. Crear reserva
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

      // 2. Crear orden con los ítems seleccionados
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableId,
          customerName: name,
          items: items.map((item) => ({
            menuItemId: item.menu_item_id,
            quantity: item.quantity,
            unitPrice: item.unit_price,
          })),
        }),
      });
      if (!orderRes.ok) {
        const d = (await orderRes.json()) as { error?: string };
        throw new Error(d.error ?? "No se pudo registrar la orden");
      }
      const orderData = (await orderRes.json()) as { order: { id: string } };

      // 3. Guardar en sessionStorage
      const orderRef = `AION-${Date.now().toString(36).toUpperCase()}`;
      const lines = items.map((item) => ({
        dishId: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        lineTotal: item.unit_price * item.quantity,
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
        orderId: orderData.order.id,
      };
      savePreorderMeta(meta as PreorderMeta);
      router.push(
        `/aion/cliente/confirmacion?ref=${encodeURIComponent(orderRef)}`,
      );
    } catch (err) {
      setError(
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
      className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-6"
      style={{ background: aion.colors.pageBg }}
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          {phase === "checkout" ? (
            <button
              type="button"
              onClick={() => setPhase("review")}
              className="text-sm font-bold"
              style={{ color: aion.colors.primary }}
            >
              ← Volver
            </button>
          ) : (
            <Link
              href="/aion/cliente/experiencia"
              className="text-sm font-bold"
              style={{ color: aion.colors.primary }}
            >
              ← Volver
            </Link>
          )}
          <h1
            className="mt-2 text-2xl font-black"
            style={{ color: aion.colors.primary }}
          >
            {phase === "review" ? "Pre-orden" : "Fecha, hora y mesa"}
          </h1>
        </div>
      </header>

      {/* ── FASE 1: Revisión de ítems ── */}
      {phase === "review" && (
        <>
          {items.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm" style={{ color: aion.colors.muted }}>
                No tienes platos seleccionados todavía.
              </p>
              <Link
                href="/aion/cliente/experiencia"
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
            {error ? (
              <p className="mt-2 text-sm text-red-700">{error}</p>
            ) : null}
            <button
              type="button"
              disabled={items.length === 0}
              onClick={() => setPhase("checkout")}
              className="mt-3 w-full rounded-2xl py-3 text-sm font-bold text-white transition-all duration-300 ease-in-out disabled:opacity-50"
              style={{ background: aion.colors.primary }}
            >
              Confirmar pedido
            </button>
          </div>
        </>
      )}

      {/* ── FASE 2: Datos de reserva ── */}
      {phase === "checkout" && (
        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: aion.colors.muted }}
            >
              Nombre para la reserva
            </label>
            <input
              className="w-full rounded-2xl border-0 px-3 py-2.5 text-sm ring-1 ring-black/10"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors((o) => ({ ...o, name: undefined }));
              }}
              autoComplete="name"
            />
            {fieldErrors.name ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
            ) : null}
          </div>

          {/* Email */}
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: aion.colors.muted }}
            >
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-2xl border-0 px-3 py-2.5 text-sm ring-1 ring-black/10"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((o) => ({ ...o, email: undefined }));
              }}
              autoComplete="email"
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>

          {/* Fecha / Hora / Personas */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: aion.colors.muted }}
              >
                Fecha
              </label>
              <input
                type="date"
                className="w-full rounded-2xl border-0 px-2 py-2.5 text-sm ring-1 ring-black/10"
                min={new Date().toISOString().split("T")[0]}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setFieldErrors((o) => ({ ...o, date: undefined }));
                  setTablesSearched(false);
                }}
              />
              {fieldErrors.date ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.date}</p>
              ) : null}
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: aion.colors.muted }}
              >
                Hora
              </label>
              <input
                type="time"
                className="w-full rounded-2xl border-0 px-2 py-2.5 text-sm ring-1 ring-black/10"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setFieldErrors((o) => ({ ...o, time: undefined }));
                  setTablesSearched(false);
                }}
              />
              {fieldErrors.time ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.time}</p>
              ) : null}
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: aion.colors.muted }}
              >
                Personas
              </label>
              <input
                type="number"
                min={1}
                max={20}
                className="w-full rounded-2xl border-0 px-2 py-2.5 text-sm ring-1 ring-black/10"
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
                          setFieldErrors((o) => ({ ...o, table: undefined }));
                        }}
                        className="rounded-2xl border p-2 text-sm font-medium transition"
                        style={
                          tableId === t.id
                            ? {
                                borderColor: aion.colors.primary,
                                background: "#FFF5F7",
                                color: aion.colors.primary,
                              }
                            : {
                                borderColor: "#e7e5e4",
                                color: aion.colors.text,
                              }
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
                  {fieldErrors.table ? (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.table}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Resumen */}
          <div className="rounded-2xl bg-white p-3 text-sm ring-1 ring-black/5">
            <p className="font-semibold" style={{ color: aion.colors.muted }}>
              Tu preorden
            </p>
            <ul className="mt-2 space-y-1">
              {items.map((item) => (
                <li
                  key={item.menu_item_id}
                  className="flex justify-between text-xs"
                >
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span>
                    ${(item.unit_price * item.quantity).toLocaleString("es-CO")}
                  </span>
                </li>
              ))}
            </ul>
            <p
              className="mt-2 flex justify-between border-t border-stone-100 pt-2 text-sm font-extrabold"
              style={{ color: aion.colors.primary }}
            >
              <span>Total</span>
              <span>${total.toLocaleString("es-CO")}</span>
            </p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={saving || !tableId}
            className="w-full rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: aion.colors.primary }}
          >
            {saving ? "Confirmando…" : "Confirmar reserva y preorden"}
          </button>
        </form>
      )}

      {/* Sheet para agregar más platos */}
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
