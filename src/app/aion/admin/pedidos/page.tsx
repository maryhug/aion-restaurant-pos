"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ExportButton } from "@/features/admin/components/export-button";
import { exportRowsAsCSV, formatCOP, paginate } from "@/features/admin/helpers";
import {
  ShoppingBagIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ReceiptIcon,
} from "@/features/admin/components/icons";

type Order = {
  id: string;
  fullId: string;
  date: string;
  tableOrType: string;
  customer: string;
  status: string;
  paymentMethod: string;
  total: number;
};

/* ─── Status styling ────────────────────────────────────────── */

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  delivered: "Entregado",
  ready: "Listo",
  cancelled: "Cancelado",
  preparing: "Preparando",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  ready: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  preparing: "bg-purple-100 text-purple-700",
};

const STATUS_ICON: Record<string, string> = {
  pending: "bg-amber-50 text-amber-500",
  delivered: "bg-emerald-50 text-emerald-600",
  ready: "bg-blue-50 text-blue-600",
  cancelled: "bg-red-50 text-red-500",
  preparing: "bg-purple-50 text-purple-600",
};

function statusBadge(s: string) {
  return STATUS_BADGE[s] ?? "bg-stone-100 text-stone-600";
}
function statusIcon(s: string) {
  return STATUS_ICON[s] ?? "bg-stone-50 text-stone-500";
}
function statusLabel(s: string) {
  return STATUS_LABEL[s] ?? s;
}

/* ─── Single order card ─────────────────────────────────────── */

function OrderCard({ order, highlight }: { order: Order; highlight: boolean }) {
  const date = new Date(order.date).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      className={`flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        highlight
          ? "ring-2 ring-[var(--admin-primary,#581c22)] ring-offset-2"
          : ""
      }`}
    >
      {/* Status icon */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statusIcon(order.status)}`}
      >
        <ShoppingBagIcon className="h-6 w-6" />
      </div>

      {/* Main info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-stone-900">
            #{order.id}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(order.status)}`}
          >
            {statusLabel(order.status)}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="flex items-center gap-1 text-sm text-stone-600">
            <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0 text-stone-400" />
            {date}
          </span>
          <span className="flex items-center gap-1 text-sm text-stone-600">
            <ReceiptIcon className="h-3.5 w-3.5 shrink-0 text-stone-400" />
            {order.tableOrType}
          </span>
          {order.customer !== "-" && (
            <span
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--admin-primary,#581c22)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-3.5 w-3.5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              {order.customer}
            </span>
          )}
        </div>

        <p
          className="mt-1 text-xs font-medium"
          style={{ color: "var(--admin-primary,#581c22)" }}
        >
          {order.paymentMethod}
        </p>
      </div>

      {/* Total + action */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-lg font-bold tabular-nums text-stone-900">
          {formatCOP(order.total)}
        </span>
        <Link
          href={`/aion/admin/pedidos/${order.fullId}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--admin-primary,#581c22)] text-white transition-opacity hover:opacity-80"
          title="Ver detalle del pedido"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

/* ─── Pagination ─────────────────────────────────────────────── */

function PaginationBar({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between text-sm text-stone-500">
      <span>
        Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-xl border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-xl border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

/* ─── Orders content (reads searchParams) ───────────────────── */

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d: { orders: Order[] }) => setOrders(d.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statuses = useMemo(
    () => [...new Set(orders.map((o) => o.status))],
    [orders],
  );

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchQuery = `${o.id}${o.customer}${o.tableOrType}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchStatus = !statusFilter || o.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [orders, query, statusFilter]);

  const paged = paginate(filtered, page, 10);

  // The ID coming from notification link (highlight first match)
  const highlightId = initialQuery && paged.length > 0 ? paged[0]?.id : null;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-stone-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-stone-400">Filtrar por:</span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar ID, cliente o mesa"
          className="min-w-48 flex-1 rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary,#581c22)] focus:ring-1 focus:ring-[var(--admin-primary,#581c22)]"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              setStatusFilter("");
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === ""
                ? "bg-[var(--admin-primary,#581c22)] text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Todos
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? "bg-[var(--admin-primary,#581c22)] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {statusLabel(s)}
            </button>
          ))}
        </div>
        <ExportButton
          onClick={() =>
            exportRowsAsCSV(
              "pedidos.csv",
              filtered.map((o) => ({
                id: o.id,
                fecha: new Date(o.date).toLocaleString("es-CO"),
                mesa: o.tableOrType,
                cliente: o.customer,
                estado: o.status,
                pago: o.paymentMethod,
                total: o.total,
              })),
            )
          }
        />
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-stone-200 text-sm text-stone-400">
          No se encontraron pedidos
        </div>
      ) : (
        <div className="space-y-3">
          {paged.map((o) => (
            <OrderCard
              key={o.fullId}
              order={o}
              highlight={!!highlightId && o.id === highlightId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <PaginationBar
        page={page}
        total={filtered.length}
        pageSize={10}
        onPageChange={setPage}
      />
    </div>
  );
}

/* ─── Page export ────────────────────────────────────────────── */

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm text-stone-400">
          Cargando pedidos…
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
