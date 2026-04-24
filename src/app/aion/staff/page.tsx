"use client";

import Link from "next/link";
import { useState } from "react";
import { aion } from "@/lib/aion/tokens";
import type { AionStaffOrder, OrderState } from "@/lib/aion/types";
import { AionLogoutButton } from "@/components/aion/auth/logout-button";

const initial: AionStaffOrder[] = [
  {
    id: "ORD-001",
    tableLabel: "Mesa 3",
    customerName: "María García",
    state: "pendiente",
    waitLabel: "Llegó hace 6m",
    urgent: false,
    items: [
      { name: "Carpaccio de Res", quantity: 2, dishId: "carpaccio", emoji: "🥩" },
    ],
  },
  {
    id: "ORD-002",
    tableLabel: "Mesa 7",
    customerName: "Carlos M.",
    state: "preparando",
    waitLabel: "Llegó hace 14m",
    urgent: true,
    items: [
      { name: "Risotto de Hongos", quantity: 1, dishId: "risotto", emoji: "🍄" },
      { name: "Limonada Natural", quantity: 1, dishId: "limonada", emoji: "🍋" },
    ],
  },
  {
    id: "ORD-003",
    tableLabel: "Bar 1",
    customerName: "Elena R.",
    state: "preparando",
    waitLabel: "Llegó hace 2m",
    urgent: false,
    items: [
      { name: "Bruschetta Mediterránea", quantity: 1, dishId: "bruschetta", emoji: "🍅" },
    ],
  },
  {
    id: "ORD-004",
    tableLabel: "Mesa 2",
    customerName: "Grupo 4p",
    state: "listo",
    waitLabel: "Llegó hace 1m",
    urgent: false,
    items: [
      { name: "Ensalada César", quantity: 2, dishId: "cesar", emoji: "🥗" },
    ],
  },
];

function setOfState(list: AionStaffOrder[], s: OrderState) {
  return list.filter((o) => o.state === s);
}

export default function AionStaffDashboardPage() {
  const [orders, setOrders] = useState(initial);

  function advance(id: string) {
    setOrders((list) =>
      list.map((o) => {
        if (o.id !== id) return o;
        if (o.state === "pendiente") return { ...o, state: "preparando" as const, urgent: false };
        if (o.state === "preparando") return { ...o, state: "listo" as const };
        return o;
      }),
    );
  }

  const p = setOfState(orders, "pendiente").length;
  const pr = setOfState(orders, "preparando").length;
  const l = setOfState(orders, "listo").length;
  const u = orders.filter((o) => o.urgent).length;

  return (
    <div className="min-h-dvh" style={{ background: aion.colors.staffBg }}>
      <header className="border-b border-stone-200/80 bg-white px-4 py-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <p className="text-sm font-extrabold" style={{ color: aion.colors.primaryAlt }}>
            AION Staff
          </p>
          <nav
            className="flex items-center gap-2 text-xs font-medium sm:gap-4"
            style={{ color: aion.colors.muted }}
            aria-label="Navegación"
          >
            <span className="hidden sm:inline" aria-current="page">
              Dashboard
            </span>
            <Link
              className="rounded-lg border border-stone-200/80 px-2 py-1"
              style={{ color: aion.colors.text }}
              href="/aion"
            >
              Inicio
            </Link>
            <AionLogoutButton
              className="rounded-lg border border-stone-200/80 px-2 py-1 disabled:opacity-70"
              style={{ color: aion.colors.danger }}
              label="Salir"
            />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl p-3 sm:p-4">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-lg font-extrabold" style={{ color: aion.colors.text }}>
              Dashboard de pedidos
            </h1>
            <p className="text-sm" style={{ color: aion.colors.muted }}>
              miércoles, 22 de abril · 19:15
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-2xl px-3 py-1.5 text-sm font-bold text-white"
            style={{ background: aion.colors.primaryAlt }}
          >
            Ver todos los pedidos
          </button>
        </div>
        <ul className="mb-3 grid list-none grid-cols-2 gap-2 sm:grid-cols-4">
          <li className="flex items-center gap-2 rounded-2xl border border-amber-100/80 bg-white p-2 text-sm">
            <span
              className="grid size-7 place-items-center rounded-lg"
              style={{ color: aion.colors.warning, background: "#FEF3C7" }}
              aria-hidden
            >
              🕐
            </span>
            <div>
              <p className="text-xs" style={{ color: aion.colors.muted }}>Pendientes</p>
              <p className="text-lg font-bold">{p}</p>
            </div>
          </li>
          <li className="flex items-center gap-2 rounded-2xl border border-blue-100/80 bg-white p-2 text-sm">
            <span className="grid size-7 place-items-center rounded-lg bg-blue-100 text-lg" aria-hidden>👨‍🍳</span>
            <div>
              <p className="text-xs" style={{ color: aion.colors.muted }}>Preparando</p>
              <p className="text-lg font-bold">{pr}</p>
            </div>
          </li>
          <li className="flex items-center gap-2 rounded-2xl border border-emerald-100/80 bg-white p-2 text-sm">
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-100 text-sm font-bold" style={{ color: aion.colors.success }} aria-hidden>✓</span>
            <div>
              <p className="text-xs" style={{ color: aion.colors.muted }}>Listos</p>
              <p className="text-lg font-bold">{l}</p>
            </div>
          </li>
          <li
            className="flex items-center gap-2 rounded-2xl p-2 text-sm"
            style={{
              border: `1px solid ${aion.colors.danger}55`,
              background: "#FEF2F2",
            }}
          >
            <span
              className="text-lg"
              style={{ color: aion.colors.danger }}
              aria-hidden>⚠</span>
            <div>
              <p className="text-xs" style={{ color: aion.colors.muted }}>Urgentes</p>
              <p
                className="text-lg font-bold"
                style={{ color: aion.colors.danger }}
              >{u}</p>
            </div>
          </li>
        </ul>
        <div
          className="grid items-start gap-2 sm:grid-cols-3"
          style={{ minHeight: "50vh" }}
        >
          <AionCol
            title="Pendientes"
            count={p}
            dotColor={aion.colors.warning}
            list={setOfState(orders, "pendiente")}
            actionLabel="Iniciar"
            onAction={advance}
          />
          <AionCol
            title="Preparando"
            count={pr}
            dotColor={aion.colors.info}
            list={setOfState(orders, "preparando")}
            actionLabel="Listo"
            onAction={advance}
            primaryCta
          />
          <AionCol
            title="Listos"
            count={l}
            dotColor={aion.colors.success}
            list={setOfState(orders, "listo")}
            actionLabel="Entregar"
            onAction={advance}
            deliver
          />
        </div>
      </div>
    </div>
  );
}

type Col = {
  title: string;
  count: number;
  dotColor: string;
  list: AionStaffOrder[];
  actionLabel: string;
  onAction: (id: string) => void;
  primaryCta?: boolean;
  deliver?: boolean;
};

function AionCol({
  title,
  count,
  dotColor,
  list,
  actionLabel,
  onAction,
  primaryCta = false,
  deliver = false,
}: Col) {
  return (
    <section
      className="rounded-2xl bg-white/90 p-2"
      style={{ minHeight: "200px" }}
    >
      <h2
        className="mb-2 flex items-center gap-2 text-sm font-bold"
        style={{ color: aion.colors.text }}
      >
        <span
          className="inline-block size-2.5 rounded-full"
          style={{ background: dotColor }}
        />
        {title} ({count})
      </h2>
      <ul className="flex list-none flex-col gap-2">
        {list.map((o) => (
          <li
            key={o.id}
            className="rounded-2xl border border-stone-200/60 bg-stone-50/80 p-2.5"
          >
            <div className="flex items-start justify-between text-xs">
              <span
                className="font-mono text-[11px] font-bold"
                style={{ color: aion.colors.text }}
              >
                {o.id}
                {o.urgent && o.state === "preparando" ? (
                  <span
                    className="ml-1.5 inline rounded bg-red-500 px-1.5 text-[9px] font-extrabold text-white"
                  >
                    URGENTE
                  </span>
                ) : null}
              </span>
              <span style={{ color: aion.colors.muted }}>{o.tableLabel}</span>
            </div>
            <p
              className="text-sm font-bold"
              style={{ color: aion.colors.text }}
            >
              {o.customerName}
            </p>
            <p
              className="text-right text-[11px] font-bold"
              style={{ color: aion.colors.danger }}
            >{o.waitLabel}</p>
            <ul
              className="mt-1 list-inside list-disc text-xs"
              style={{ color: aion.colors.muted }}
            >
              {o.items.map((i) => (
                <li key={i.dishId + o.id} className="list-item">
                  {i.quantity}× {i.name}
                  {i.emoji ? ` ${i.emoji}` : ""}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-2 w-full rounded-xl py-1.5 text-sm font-bold"
              onClick={() => onAction(o.id)}
              style={
                primaryCta && o.state === "preparando"
                  ? { background: aion.colors.primary, color: "#fff" }
                  : {
                      background: aion.colors.pillInactive,
                      color: aion.colors.text,
                    }
              }
            >
              {deliver ? "Entregar" : o.state === "pendiente" ? "Iniciar" : o.state === "preparando" ? "Listo" : "Entregado"}
            </button>
          </li>
        ))}
        {list.length === 0 ? (
          <li
          className="p-2 text-center text-sm"
          style={{ color: aion.colors.muted }}
        >Nada en esta cola</li>
        ) : null}
      </ul>
    </section>
  );
}
