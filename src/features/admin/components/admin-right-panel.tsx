"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { formatCOP } from "@/features/admin/helpers";

/* ─── Calendar ─────────────────────────────────────────────── */

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekdayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Mon=0 … Sun=6
}

function MiniCalendar() {
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const { year, month } = view;
  const total = daysInMonth(year, month);
  const offset = firstWeekdayOfMonth(year, month);

  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  const isToday = (d: number) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  function prev() {
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  }
  function next() {
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  }

  return (
    <div>
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-900">
          {MONTHS_ES[month].slice(0, 3)} {year}
        </h3>
        <div className="flex gap-0.5">
          <button
            onClick={prev}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label="Mes anterior"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={next}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label="Mes siguiente"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-stone-400"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => (
          <div key={i} className="flex items-center justify-center">
            {d !== null ? (
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isToday(d)
                    ? "bg-[var(--admin-primary,#581c22)] font-semibold text-white"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                {d}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Recent clients ────────────────────────────────────────── */

type Cliente = {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  isActive: boolean;
};

function nameInitials(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function RecentClientes() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/clientes")
      .then((r) => r.json())
      .then((d: { clients: Cliente[] }) => setClients(d.clients.slice(0, 5)))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-900">Clientes recientes</h3>
        <Link
          href="/aion/admin/clientes"
          className="text-xs font-medium text-[var(--admin-primary,#581c22)] hover:underline"
        >
          Ver todos
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-stone-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-stone-200" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <p className="text-xs text-stone-400">Sin clientes registrados aún.</p>
      ) : (
        <ul className="space-y-3">
          {clients.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--admin-primary, #581c22) 85%, black)",
                  }}
                >
                  {nameInitials(c.name)}
                </div>
                {c.isActive && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-800">
                  {c.name}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {c.totalOrders} pedidos · {formatCOP(c.totalSpent)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Panel export ──────────────────────────────────────────── */

export function AdminRightPanel() {
  return (
    <aside className="admin-scrollbar sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-5 overflow-y-auto border-l border-stone-100 bg-white px-5 py-6 xl:flex">
      {/* Calendar widget */}
      <section className="rounded-2xl bg-[var(--admin-bg,#fafafa)] p-4">
        <MiniCalendar />
      </section>

      {/* Recent clients widget */}
      <section className="rounded-2xl bg-[var(--admin-bg,#fafafa)] p-4">
        <RecentClientes />
      </section>
    </aside>
  );
}
