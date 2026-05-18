"use client";

import { useEffect, useState } from "react";
import { formatCOP } from "@/features/admin/helpers";
import {
  SearchIcon,
  UsersIcon,
  ShoppingBagIcon,
  BanknotesIcon,
  ChevronRightIcon,
} from "@/features/admin/components/icons";

type ClienteAdmin = {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  lastOrderDate: string | null;
  lastOrderAmount: number;
  totalSpent: number;
  isActive: boolean;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.floor(days / 7)} sem.`;
  return `hace ${Math.floor(days / 30)} mes${Math.floor(days / 30) > 1 ? "es" : ""}`;
}

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

/* ─── Client card ────────────────────────────────────────────── */

function ClientCard({ client }: { client: ClienteAdmin }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: "var(--admin-primary,#581c22)" }}
        >
          {nameInitials(client.name)}
        </div>
        {client.isActive && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-stone-900">
            {client.name}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              client.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            {client.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-stone-500">{client.email}</p>
        {client.lastOrderDate && (
          <p
            className="mt-1 text-xs font-medium"
            style={{ color: "var(--admin-primary,#581c22)" }}
          >
            Último pedido: {timeAgo(client.lastOrderDate)} ·{" "}
            {formatCOP(client.lastOrderAmount)}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-stone-800">
          <ShoppingBagIcon className="h-4 w-4 text-stone-400" />
          {client.totalOrders} pedidos
        </div>
        <div className="flex items-center gap-1.5 text-sm font-bold text-stone-900">
          <BanknotesIcon className="h-4 w-4 text-stone-400" />
          {formatCOP(client.totalSpent)}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--admin-primary,#581c22)] text-white">
        <ChevronRightIcon className="h-4 w-4" />
      </div>
    </article>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function ClientesPage() {
  const [data, setData] = useState<ClienteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    fetch("/api/admin/clientes")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<{ clients: ClienteAdmin[] }>;
      })
      .then((d) => setData(d.clients))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "active" && c.isActive) ||
      (filter === "inactive" && !c.isActive);
    return matchSearch && matchFilter;
  });

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-red-500">
        Error al cargar clientes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-stone-400">Filtrar por:</span>

        <div className="flex gap-1.5">
          {(
            [
              { value: "all", label: "Todos" },
              { value: "active", label: "Activos" },
              { value: "inactive", label: "Inactivos" },
            ] as const
          ).map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.value
                  ? "bg-[var(--admin-primary,#581c22)] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Buscar nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--admin-primary,#581c22)] focus:ring-1 focus:ring-[var(--admin-primary,#581c22)]"
          />
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-stone-400">
          {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-stone-100"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <UsersIcon className="h-12 w-12 text-stone-200" />
          <p className="font-medium text-stone-500">
            {search ? `Sin resultados para "${search}"` : "No hay clientes aún"}
          </p>
          <p className="text-xs text-stone-400">
            Los clientes aparecen cuando realizan su primer pedido
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <ClientCard key={c.id} client={c} />
          ))}
        </div>
      )}
    </div>
  );
}
